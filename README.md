# Password Generator

[![CI (build)](https://github.com/tats-u/pwgen/workflows/Build/badge.svg)](https://github.com/tats-u/pwgen/actions/workflows/build.yml)

<https://pwgen-tats-u.vercel.app/>

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

![Preview image](https://user-images.githubusercontent.com/12870451/212541177-cf407459-a965-46af-a10c-82d09e3c21b9.png)

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
# Note: unavailable because next-i18next doesn't support SSG
# $ yarn generate
```

## Privacy Policy

1. This generator _WILL NEVER_ generate passwords in remote servers or send generated passwords anywhere. The site only provides a way to generate them _JUST IN_ your browser.
2. This generator saves password generation settings in your browser to save you the time of reproducing the same settings next time. Saved settings are also never sent anywhere. This feature is implemented using the [Web Storage API (`localStorage`)](https://developer.mozilla.org/docs/Web/API/Web_Storage_API).
