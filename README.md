# Password Generator

[![CI (build)](https://github.com/tats-u/pwgen/workflows/Build/badge.svg)](https://github.com/tats-u/pwgen/actions/workflows/build.yml)

<https://tats-u.github.io/pwgen/>

This is a highly-customizable online password generator made with Next.js (& React).

In this generator, you can:

- Adjust the probabilities of appearance of alphabets & numbers & symbols.
- Adjust the length of generated passwords.
- Exclude uppercase or numbers or symbols from generated passwords.
- Customize maybe-contained symbols (except for white space)
- Copy generated passwords by a simple click.

You will be able to (can't for now though):

- Restrict the type of a character next to another character.

[Previous generation app made with Nuxt 2 (unmaintained)](https://github.com/tats-u/pwgen-legacy/)

## Preview

![Preview image](https://user-images.githubusercontent.com/12870451/72742938-0b88ee80-3bee-11ea-8d5c-c39be76c029b.png)

## Build Setup

```bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
```

## Privacy Policy

This generator _WILL NEVER_ generate passwords in remote servers or submit generated ones to anywhere. The page just provides an way to generate ones _JUST IN_ your browser.

In the future, this generator may save settings for password generation in your browser to save time to reproduce the same settings next time.
