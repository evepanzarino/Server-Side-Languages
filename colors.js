// Async / Await: The Color API
// Picks a random color, logs its info, and builds a pallette of colors that go with it.
// Run with: node colors.js

// 1. Making multiple API calls with async / await
// 2. Pulling data out of the responses and putting it together

// async lets the function use await.
// await waits for the fetch to finish before going to the next line.

async function getColorData(hex) {
  // Error handling: the API only understands 6-digit hex codes, like 24b1e0.
  // It doesn't send an error for a bad code, so check it before calling.
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    throw new Error(`${hex} is not a 6-digit hex code`);
  }

  // Step 1: get the color by its hex code.
  const colorResponse = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`);

  // Error handling
  // check response.ok and throw an error
  if (!colorResponse.ok) {
    throw new Error(`Color request failed with status ${colorResponse.status}`);
  }
  const color = await colorResponse.json();

  // Step 2: the first response has the cleaned-up hex code, use it to get
  // a scheme of 5 colors that go with it.
  const schemeResponse = await fetch(
    `https://www.thecolorapi.com/scheme?hex=${color.hex.clean}&mode=analogic&count=5`
  );
  if (!schemeResponse.ok) {
    throw new Error(`Scheme request failed with status ${schemeResponse.status}`);
  }
  const scheme = await schemeResponse.json();

  // Step 3: put the data from both calls into one object.
  return {
    // From the color call
    name: color.name.value, // ex: 'Cerulean'
    hex: color.hex.value, // ex: '#24B1E0'
    rgb: color.rgb.value, // ex: 'rgb(36, 177, 224)'
    hsl: color.hsl.value, // ex: 'hsl(195, 75%, 51%)'
    contrast: color.contrast.value, // black or white, whichever is readable on this color

    // From the scheme call
    schemeMode: scheme.mode, // analogic = the colors next to it on the color wheel
    pallette: scheme.colors.map((c) => `${c.name.value} ${c.hex.value}`), // ex: 'Cerulean #22A9D5'
  };
}


// 3. Error handling
// 4. Showing the data in a readable way

async function assignmentTask() {
  // Random hex code from 000000 to ffffff.
  // There are 16777216 colors. Math.random() * 16777216 gives 0 to 16777215.99,
  // Math.floor rounds down to a whole number, toString(16) turns it into hex,
  // and padStart adds 0s to the front so it's always 6 digits.
  const hex = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');

  // try / catch: if anything in getColorData fails, it jumps to catch
  // and logs the error instead of crashing.
  try {
    const colorData = await getColorData(hex);
    console.log(`Random color #${hex}:`);
    console.log(colorData);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

assignmentTask();
