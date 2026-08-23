import { RE2JS } from 're2js'

/**
 * The Conventional Commit types we recognise, mapped from the lower-case type
 * (as written in the commit summary) to the localized label shown in the badge.
 */
const conventionalCommitTypeLabels: ReadonlyArray<[string, string]> = [
  ['feat', '功能'],
  ['feature', '功能'],
  ['fix', '修复'],
  ['hotfix', '热修复'],
  ['fixes', '修复'],
  ['chore', '杂项'],
  ['revert', '回退'],
  ['style', '样式'],
  ['spelling', '拼写'],
  ['docs', '文档'],
  ['doc', '文档'],
  ['documentation', '文档'],
  ['build', '构建'],
  ['refactor', '重构'],
  ['test', '测试'],
  ['ci', 'CI'],
  ['perf', '性能'],
  ['performance', '性能'],
  ['deps', '依赖'],
  ['dependency', '依赖'],
  ['dependencies', '依赖'],
  ['security', '安全'],
  ['release', '发布'],
  ['temp', '临时'],
  ['tmp', '临时'],
  ['wip', 'WIP'],
  ['config', '配置'],
  ['configuration', '配置'],
  ['infra', '基础设施'],
  ['infrastructure', '基础设施'],
  ['ops', '运维'],
  ['operations', '运维'],
  ['ui', 'UI'],
  ['ux', 'UX'],
  ['design', '设计'],
]

const conventionalCommitLabelsByType = new Map<string, string>(
  conventionalCommitTypeLabels
)

/**
 * Deduplicated, ordered options for a Conventional Commit type picker.
 * Aliases collapse onto their canonical English type (first one wins).
 */
export const conventionalCommitTypeOptions: ReadonlyArray<{
  readonly type: string
  readonly label: string
}> = (() => {
  const seen = new Set<string>()
  const options: Array<{ type: string; label: string }> = []

  for (const [type, label] of conventionalCommitTypeLabels) {
    if (!seen.has(label)) {
      seen.add(label)
      options.push({ type, label })
    }
  }

  return options
})()

/**
 * Maps any recognised Conventional Commit type alias (`feature`, `doc`,
 * `dependency`, …) onto the canonical English type used by the picker
 * options, or `null` when the type is unknown.
 */
export function canonicalizeConventionalCommitType(
  type: string
): string | null {
  const normalized = type.toLowerCase()

  if (
    conventionalCommitTypeOptions.some(option => option.type === normalized)
  ) {
    return normalized
  }

  const label = conventionalCommitLabelsByType.get(normalized)

  if (label === undefined) {
    return null
  }

  return (
    conventionalCommitTypeOptions.find(option => option.label === label)
      ?.type ?? null
  )
}

/**
 * Composes a Conventional Commits v1 header from its structured parts:
 * `<type>(<scope>)!: <summary>` with the scope omitted when empty.
 */
export function composeConventionalCommitHeader(
  type: string,
  scope: string,
  isBreakingChange: boolean,
  summary: string
): string {
  const trimmedScope = scope.trim()
  const scopePart = trimmedScope.length > 0 ? `(${trimmedScope})` : ''
  const breakingMarker = isBreakingChange ? '!' : ''

  return `${type}${scopePart}${breakingMarker}: ${summary.trim()}`
}

const autosquashPrefixes = '(?:(?:fixup|squash|amend)!\\s+)*'
const mergeRevertPrefix = '(?:(?:Merge|Revert|Reapply)\\s+"?)?'
const conventionalPrefix = '(\\w+)(?:\\((.+?)\\))?(!)?: *'
/**
 * Matches the Conventional Commits prefix `type(scope)!: ` at the start of a
 * commit summary, capturing the type, the optional scope and the optional
 * breaking-change (`!`) marker.
 */
const conventionalCommitPattern = RE2JS.compile(
  `^\\s*(${autosquashPrefixes}${mergeRevertPrefix})\\s*${conventionalPrefix}`
)

/** A parsed Conventional Commit prefix. */
export interface IConventionalCommit {
  /** The raw, lower-case type (e.g. `feat`). Used to pick the badge color. */
  readonly rawType: string

  /** The human readable label shown in the badge (e.g. `Feature`, `Fix!`). */
  readonly label: string

  /** The optional scope (the text inside the parentheses), or null. */
  readonly scope: string | null

  /** Plain text rendered before the badge: `Merge`/`Revert`..., autosquash prefixes, etc. */
  readonly leftSideText: string

  /** The remainder of the summary rendered after the badge, with the prefix stripped. */
  readonly rightSideText: string
}

/**
 * Parses a commit summary as a Conventional Commit.
 *
 * Returns the parsed prefix (type, scope, breaking-change marker and the
 * remaining text) when the summary starts with a recognised Conventional
 * Commit prefix, or `null` otherwise.
 *
 * This is deliberately allocation-light and short-circuits as early as possible
 * because it runs on the render path of the commit list.
 */
export function parseConventionalCommit(
  summary: string
): IConventionalCommit | null {
  const matcher = conventionalCommitPattern.matcher(summary)

  if (!matcher.lookingAt()) {
    return null
  }

  const matchedType = matcher.group(2)
  if (matchedType === null) {
    return null
  }

  // The Conventional Commits spec allows any casing for the type, normalise to lower case
  const rawType = matchedType.toLowerCase()
  const baseLabel = conventionalCommitLabelsByType.get(rawType) ?? matchedType

  const isBreaking = matcher.group(4) !== null

  return {
    rawType,
    label: isBreaking ? `${baseLabel}!` : baseLabel,
    scope: matcher.group(3),
    leftSideText: matcher.group(1) ?? '',
    rightSideText: summary.substring(matcher.end()),
  }
}
