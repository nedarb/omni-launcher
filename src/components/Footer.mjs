import {
  html, useEffect, useState,
} from '../lib/htm-preact-standalone.mjs';

const githubLogo = browser.runtime.getURL('../assets/logo-github.png');
const githubLogoLight = browser.runtime.getURL('../assets/logo-github2.png');

const mediaMatch = window.matchMedia('(prefers-color-scheme: dark)');
const schemeFromMediaMatch = (mm = mediaMatch)=> mm.matches ? 'dark' : 'light';
function useColorScheme() {
  const [scheme, setScheme] = useState(schemeFromMediaMatch(mediaMatch));

  useEffect(()=>{
    const handler = function (e) {
      const colorScheme = schemeFromMediaMatch(e);
      setScheme(colorScheme);
      console.log(colorScheme);
    };
    mediaMatch.addEventListener('change', handler);
    return ()=> mediaMatch.removeEventListener('change', handler);
  },[]);
  
  return scheme;
}

export default function Footer() {
  const scheme = useColorScheme();
  const logo = scheme === 'dark' ? githubLogo : githubLogoLight;
  return html`<section class="footer">(c) 2022 nedarb <a href="https://github.com/nedarb/omni-launcher" target="_blank"><img class="github-logo" src="${logo}" /></a></section>`;
}