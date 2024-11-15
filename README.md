# WooCommerce Brands

[WooCommerce Brands](https://woocommerce.com/products/brands/) plugin managed by Git and Composer.

## Changelog



## Development

### 1.Making changes, updating and keeping in sync with the original plugin's source code:

This repository has 3 branches:
- `main` - It's the main branch that contains source code from the original plugin and all the modifications done by us, after everything is tested, verified and merged.
- `vendor` - It's the branch that only contains source code from the original plugin. No modifications are allowed here.
- `develop` - It's the branch that contains source code from the original plugin and any needed modifications done by us. Here we merge from `vendor`, fix issues and test before merging everything into the `main` branch.

#### **Example:**

Let's assume that we need to update the plugin with new version `X.Y.Z`.

**Always include the plugin’s version number in your commit message so that you can easily reference it later!**

First we switch to the `vendor` branch and there copy the source code files from the original plugin version `X.Y.Z`.

After committing the changes we need to switch to the `develop` branch and merge the `vendor` branch into `develop`.

Any manual changes in the `develop` branch must be **marked** with the following lines in form of a single line PHP/JavaScript/CSS comment:

```
//[PLUGIN CHANGE START]

//[PLUGIN CHANGE END]
```

After everything is merged, Git conflicts are resolved and some needed changes are made, we can merge our the `develop` branch and into `main`.

Switching to `main` and merging the changes from `develop` is the last step.

### 2.Creating a release and private Composer package

Before creating a release be sure to commit all of your changes.

You can do this by executing the ```release.sh``` shell script.

Creating a release means creating a Git tag and pushing it to the remote repository. It will create a private ```composer``` package too.

If you only made some changes in develop branch without any major plugin updates you can use the ```CUSTOM_PLUGIN_VERSION``` env variable
to specify the Git tag name.

It must be in the following format:```X.Y.Z-patchW```, where X,Y,Z and W are numbers.

```
export CUSTOM_PLUGIN_VERSION=1.6.61-patch1
```

If the tag already exists in the remote or in the local Git repository the script will stop with the execution.

### 3.Adding the plugin to some Composer managed WordPress project like Bedrock:

Edit your Bedrock `composer.json` file, add your repository and plugin.

Add the repository to the `repositories` section and the plugin with the version number to the `require` section in the `composer.json` file:

```
"repositories": [
    {
      "type": "vcs",
      "url": "git@github.com:digitalnodecom/woocommerce-brands.git"
    }
],
"require": {
    "digitalnodecom/woocommerce-brands": "X.Y.Z"
}
```

or if you have a Repman composer registry:

```
"repositories": [
    {
      "type": "composer",
      "url": "https://brandsgateway.repo.repman.io"
    }
],
"require": {
    "digitalnodecom/woocommerce-brands": "X.Y.Z"
}
```

Run `composer require` to get the latest plugin version.

If this does not work try:

Delete the ```composer.lock``` file and  run `composer install` to get the latest plugin version.