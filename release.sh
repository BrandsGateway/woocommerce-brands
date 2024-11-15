#!/usr/bin/env bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;93m'
NC='\033[0m'

PLUGIN_MAIN_FILE="woocommerce-brands.php"
PLUGIN_VERSION=`grep 'Version' ${PLUGIN_MAIN_FILE}`

REGEX="(Version:.*)([0-9]+).([0-9]+).([0-9]+)"

if [[ ! $PLUGIN_VERSION =~ $REGEX ]]; then
  echo -e ${RED}"Failed to parse the plugin version from the main file: $PLUGIN_MAIN_FILE. ${NC}" && exit 1;
fi

PLUGIN_VERSION="${BASH_REMATCH[2]}.${BASH_REMATCH[3]}.${BASH_REMATCH[4]}"

# We have the main plugin version that will be used as a tag name. Now we will check if we have own custom version from .env file to be used as tag name
if [[ -n $CUSTOM_PLUGIN_VERSION ]] ; then

  REGEX="([0-9]+).([0-9]+).([0-9]+)-patch([0-9]+)"

  # If custom plugin version is found and with valid format it will overwrite the plugin version value that will be used for the tag name
  if [[ $CUSTOM_PLUGIN_VERSION =~ $REGEX ]]; then
    PLUGIN_VERSION=$CUSTOM_PLUGIN_VERSION
  fi
fi

# Now let see if this tag already exists in the remote and local Git repositories
GIT_REMOTE_TAGS=$(git ls-remote --tags 2>/dev/null )

for GIT_TAG in $GIT_REMOTE_TAGS; do
  if [[ $GIT_TAG == "refs/tags/$PLUGIN_VERSION" ]] ; then
    GIT_TAG_EXISTS=true
  fi
done

if [[ "$GIT_TAG_EXISTS" = true ]] ; then
	echo -e ${RED}"Tag with the plugin version: $PLUGIN_VERSION already exists in the remote repository ${NC}" && exit 1;
fi

GIT_LOCAL_TAGS=$(git tag 2>/dev/null )

for GIT_TAG in $GIT_LOCAL_TAGS; do
  if [[ $GIT_TAG == $PLUGIN_VERSION ]] ; then
    GIT_TAG_EXISTS=true
  fi
done

if [[ "$GIT_TAG_EXISTS" = true ]] ; then
	echo -e ${RED}"Tag with the plugin version: $PLUGIN_VERSION already exists in the local repository ${NC}" && exit 1;
fi

echo -e ${GREEN}"Installing optimized Composer packages without dev dependencies ${NC}"
composer install --optimize-autoloader --no-dev &> /dev/null

# Store the original state of .gitignore
cp .gitignore .gitignore_backup
sed -i '' -e 's#vendor#!vendor#g' .gitignore

echo -e ${GREEN}"Adding composer vendor folder to the Git repository for the release ${NC}"
git add vendor &> /dev/null

git commit -m "Include compiled frontend assets and composer vendor folder for the Composer package version: $PLUGIN_VERSION" &> /dev/null

# At this point all of the required checks passed. We will first create a Git tag and push it to the remote repository before creating Composer package from it.
# Make sure that you have committed all of your changes to Git
echo -e ${GREEN}"Creating a Git tag from the plugin version: $PLUGIN_VERSION repository and pushing it to origin ${NC}"
git tag $PLUGIN_VERSION
git push --quiet -u --no-progress origin $PLUGIN_VERSION

# Restore the original .gitignore
echo -e ${GREEN}"Removing previously added Git ignored files from the repository ${NC}"
mv .gitignore_backup .gitignore
git rm -r --cached vendor &> /dev/null
git add .
git commit -m "Removed previously added Git ignored files from the repository for the plugin release version: $PLUGIN_VERSION" &> /dev/null
git push --quiet -u --no-progress origin

echo -e ${GREEN}"Release done for the plugin with version: $PLUGIN_VERSION ${NC}"
