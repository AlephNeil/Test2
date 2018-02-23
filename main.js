'use strict';

console.log('Hello world!');
const myname = "Neil"
const blah = `alpha ${myname} beta`
console.log(`The value of blah is ${blah}`)

var webdriver = require('selenium-webdriver');
var browser = new webdriver.Builder()
    .usingServer()
    .withCapabilities({'browserName': 'chrome'})
    .build();

browser.get('http://en.wikipedia.org/wiki/Wiki');
browser.findElements(webdriver.By.css('[href^="/wiki/"]'))
    .then(function(links) {
    console.log('Found', links.length, 'Wiki links.' )
    browser.quit();
});