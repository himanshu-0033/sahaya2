// The voice picker goes by name, which is the only signal browsers give, so it
// is checked against the voice lists real platforms ship.
import assert from 'node:assert/strict';
import { pickVoice } from '../src/shared/speech.js';

const v = (name, lang) => ({ name, lang });

const windows = [
  v('Microsoft David - English (United States)', 'en-US'),
  v('Microsoft Ravi - English (India)', 'en-IN'),
  v('Microsoft Heera - English (India)', 'en-IN'),
  v('Google UK English Female', 'en-GB'),
];
assert.equal(pickVoice(windows).name, 'Microsoft Heera - English (India)', 'an Indian woman over an Indian man');

const edge = [
  v('Microsoft Prabhat Online (Natural) - English (India)', 'en-IN'),
  v('Microsoft Neerja Online (Natural) - English (India)', 'en-IN'),
  v('Microsoft Heera - English (India)', 'en-IN'),
];
assert.equal(pickVoice(edge).name, 'Microsoft Neerja Online (Natural) - English (India)', 'the natural voice when there is one');

const apple = [v('Rishi', 'en-IN'), v('Veena', 'en-IN'), v('Samantha', 'en-US')];
assert.equal(pickVoice(apple).name, 'Veena');

// No Indian woman's voice installed: the closest thing, never a male Indian one first.
const noIndian = [v('Microsoft Ravi - English (India)', 'en-IN'), v('Google UK English Female', 'en-GB')];
assert.equal(pickVoice(noIndian).name, 'Google UK English Female');

assert.equal(pickVoice([]), null, 'no voices loaded yet');
assert.equal(pickVoice([v('Thomas', 'fr-FR')]), null, 'nothing English: leave it to the browser');

console.log('voice: picks a soft Indian female voice where one exists, ok');
