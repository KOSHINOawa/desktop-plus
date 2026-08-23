# Working with Packages

As we are using `pnpm` for managing packages, here are some helpful tips for
whenever you need to work with them.

### Install packages

To ensure you have the right version of dependencies, run this command after
cloning or switching branches.

```sh
> pnpm install
```

This will restore the versions stored in the lock file to the `node_modules`
folder.

Note that this project has two independent pnpm projects: the repository root
(build tooling) and the `app` folder (application dependencies). Running
`pnpm install` at the root also installs the `app` dependencies through the
`postinstall` script.

### Add new packages

Rather than updating the `package.json` explicitly, you can install new
dependencies via the `pnpm` command line:

```sh
# adds the package to the dependencies list
> pnpm add [package-name]
# adds the package to the devDependencies list
> pnpm add [package-name] --save-dev
```

### Updating packages

To see which packages have newer versions available:

```sh
> pnpm outdated
```

To upgrade a package to its latest version:

```sh
> pnpm update --latest [package-name]
```

To upgrade a package to a specific version (or [version range](https://docs.npmjs.com/misc/semver#x-ranges-12x-1x-12-)):

```sh
> pnpm add [package-name]@[version]
```

### Removing packages

To remove any packages that are no longer needed:

```sh
> pnpm remove [package-name]
```

### Upgrading pnpm

The version of `pnpm` used by the project is pinned through the
`packageManager` field in the root `package.json`, so the same version is used
on all platforms that we develop on. If you have [Corepack](https://nodejs.org/api/corepack.html)
enabled, the correct version is downloaded automatically. To upgrade Desktop to
a newer version of `pnpm`:

- run `corepack use pnpm@x.y.z` from the repository root (ensuring the `x.y.z`
  matches the version you want), or edit the `packageManager` field manually
- commit the change and open a pull request to get it reviewed
