# Comments from Reddit
This extension lets you find existing Reddit discussions and go directly to them.

## Download
1. Download the latest [release](https://github.com/nehalvpatel/Comments-from-Reddit/releases) and unzip it.
2. Enable the [Develop menu](http://osxdaily.com/2011/11/03/enable-the-develop-menu-in-safari/) in Safari.
3. Click `Develop`→`Show Extension Builder` in the menu bar.
4. Click `+`→`Add Extension...` on the bottom left.
5. Browse to the unzipped folder and click `Select`.
6. Click `Install` and enter your password.
7. Do steps `3` and `6` every time you reopen Safari.

## Screenshot
<img src="/popover.png?raw=true" width="450">

## Options
<img src="/options.png?raw=true" width="428">

## Build
1. Install [Yarn](https://yarnpkg.com/en/docs/install).
2. Download [Comments from Reddit](https://github.com/nehalvpatel/Comments-from-Reddit/archive/master.zip) and unzip it.
3. Run `yarn install` in the unzipped directory.
4. Run `./node_modules/.bin/webpack -p --display-modules --progress`.
5. Go to the `build` folder.

## Copyright
Forked from [reddit-check](https://github.com/hsbakshi/reddit-check) by `Hrishikesh Bakshi`.

All modifications copyrighted to `Nehal Patel`.
