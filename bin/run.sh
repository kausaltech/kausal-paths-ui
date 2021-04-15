#! /bin/sh
env
if [ "$ENV" == "dev" ]; then
    # we run yarn install for convenience's sake before starting
    # dev server, so we don't need to rebuild when dependencies change
    yarn install
    yarn dev --hostname 0.0.0.0
else
    yarn start --hostname 0.0.0.0
fi
