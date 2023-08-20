let icueAvailable = false;
let icueDevices = [];

let audioCanvas = document.getElementById("keyboardCanvas");
let audioCanvasCtx = audioCanvas.getContext("2d");

let fanUpdateList = [];

let visualizerCanvas = document.getElementById("visualizer");
let visualizerCanvasCtx = visualizerCanvas.getContext("2d");

let imgStyle = document.querySelector(".mainImg").style;
let fps = 20;
let defaultProperties = {
  animatebackground: true,
  backgroundflash: true,
  backgroundflashamount: 0.1,
  backgroundflashthreshold: 0.25,
  backgroundimage: "default_wallpaper.jpg",
  backgroundpositionx: 30,
  backgroundpositiony: 10,
  backgroundpulse: true,
  backgroundpulseamount: 1,
  backgroundpulsethreshold: 0,
  backgroundshake: true,
  backgroundshakeamount: 1,
  backgroundshakethreshold: 0.25,
  barwidth: 4,
  clock: true,
  experimentalsettings: false,
  keyboardcolorhigh: [0, 0, 255],
  keyboardcolorlow: [255, 0, 0],
  lightsensitivity: 1,
  keyboardvisualizer: true,
  lightingnodelightcount: 0,
  lightingnodelightthreshold: 2,
  lightingnodevisualizer: false,
  musicbars: true,
  opacity: 0.3,
};
let globalProperties = {
  ...defaultProperties,
};

const colorWheel = {
  0: { r: 128, g: 255, b: 0 },
  1: { r: 0, g: 255, b: 255 },
  2: { r: 0, g: 128, b: 255 },
  3: { r: 128, g: 0, b: 255 },
  4: { r: 255, g: 0, b: 255 },
  5: { r: 255, g: 0, b: 0 },
  6: { r: 255, g: 128, b: 0 },
  7: { r: 255, g: 0, b: 0 },
};

let timeInterval = null;
let visualizerInterval = null;

window.wallpaperPropertyListener = {
  applyUserProperties: function (properties) {
    if (properties.animatebackground) {
      globalProperties.animatebackground = properties.animatebackground.value;
      if (!properties.animatebackground.value) {
        globalProperties.animatebackground = false;
        imgStyle.setProperty("--zoomscale", 1.02);
        imgStyle.setProperty("--opacity", globalProperties.opacity);
        imgStyle.setProperty("--rotate", 0);
      }
    }

    if (properties.backgroundflash) {
      globalProperties.backgroundflash = properties.backgroundflash.value;
      if (!globalProperties.backgroundflash) {
        imgStyle.setProperty("--opacity", globalProperties.opacity);
      }
    }

    if (properties.backgroundflashamount) {
      globalProperties.backgroundflashamount =
        properties.backgroundflashamount.value;
    }

    if (properties.backgroundflashthreshold) {
      globalProperties.backgroundflashthreshold =
        properties.backgroundflashthreshold.value;
    }

    if (properties.backgroundimage) {
      if (properties.backgroundimage.value) {
        globalProperties.backgroundimage =
          "file:///" + properties.backgroundimage.value;
      } else {
        globalProperties.backgroundimage = "default_wallpaper.jpg";
      }
      imgStyle.setProperty(
        "--image",
        `url(${globalProperties.backgroundimage})`
      );
    }

    if (properties.backgroundpositionx) {
      globalProperties.backgroundpositionx =
        properties.backgroundpositionx.value;
      imgStyle.setProperty(
        "--positionx",
        `${globalProperties.backgroundpositionx}%`
      );
    }

    if (properties.backgroundpositiony) {
      globalProperties.backgroundpositiony =
        properties.backgroundpositiony.value;
      imgStyle.setProperty(
        "--positiony",
        `${globalProperties.backgroundpositiony}%`
      );
    }

    if (properties.backgroundpulse) {
      globalProperties.backgroundpulse = properties.backgroundpulse.value;
      if (!globalProperties.backgroundpulse) {
        imgStyle.setProperty("--zoomscale", 1.02);
      }
    }

    if (properties.backgroundpulseamount) {
      globalProperties.backgroundpulseamount =
        properties.backgroundpulseamount.value;
    }

    if (properties.backgroundpulsethreshold) {
      globalProperties.backgroundpulsethreshold =
        properties.backgroundpulsethreshold.value;
    }

    if (properties.backgroundshake) {
      globalProperties.backgroundshake = properties.backgroundshake.value;
      if (!globalProperties.backgroundshake) {
        imgStyle.setProperty("--rotate", 0);
      }
    }

    if (properties.backgroundshakeamount) {
      globalProperties.backgroundshakeamount =
        properties.backgroundshakeamount.value;
    }

    if (properties.backgroundshakethreshold) {
      globalProperties.backgroundshakethreshold =
        properties.backgroundshakethreshold.value;
    }

    if (properties.barwidth) {
      globalProperties.barwidth = properties.barwidth.value;
    }

    if (properties.clock) {
      globalProperties.clock = properties.clock.value;
      if (globalProperties.clock && !timeInterval) {
        timeInterval = setInterval(time, 1000);
      } else if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
        document.getElementById("clock").innerText = "";
      }
    }

    if (properties.experimentalsettings) {
      globalProperties.experimentalsettings =
        properties.experimentalsettings.value;
      if (!globalProperties.experimentalsettings) {
        globalProperties.lightingnodevisualizer = false;
        audioCanvasCtx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
        updateCanvas();
      }
    }

    if (properties.imageopacity) {
      globalProperties.opacity = properties.imageopacity.value;
      imgStyle.setProperty("--opacity", globalProperties.opacity);
    }

    if (properties.keyboardcolorhigh) {
      const keyboardcolorhigh = properties.keyboardcolorhigh.value
        .split(" ")
        .map((c) => {
          return Math.ceil(c * 255);
        });
      if (keyboardcolorhigh.length === 3)
        globalProperties.keyboardcolorhigh = keyboardcolorhigh;
    }

    if (properties.keyboardcolorlow) {
      const keyboardcolorlow = properties.keyboardcolorlow.value
        .split(" ")
        .map((c) => {
          return Math.round(c * 255);
        });
      if (keyboardcolorlow.length === 3)
        globalProperties.keyboardcolorlow = keyboardcolorlow;
    }

    if (properties.keyboardvisualizer) {
      globalProperties.keyboardvisualizer = properties.keyboardvisualizer.value;
      if (globalProperties.keyboardvisualizer && visualizerInterval != null) {
        // Run at `fps` frames per second
      } else {
        fanUpdateList.length = 0;
        updateCanvas();
      }
    }

    if (properties.lightingnodelightcount) {
      globalProperties.lightingnodelightcount =
        properties.lightingnodelightcount.value;
    }

    if (properties.lightingnodelightthreshold) {
      globalProperties.lightingnodelightthreshold =
        properties.lightingnodelightthreshold.value;
    }

    if (properties.lightingnodevisualizer) {
      globalProperties.lightingnodevisualizer =
        properties.lightingnodevisualizer.value;
      if (
        globalProperties.lightingnodevisualizer &&
        visualizerInterval != null
      ) {
        // Run at 20 frames per second
      } else {
        audioCanvasCtx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
        updateCanvas();
      }
    }

    if (properties.lightsensitivity) {
      globalProperties.lightsensitivity = properties.lightsensitivity.value;
    }

    if (properties.musicbars) {
      if (properties.musicbars.value) {
        globalProperties.musicbars = properties.musicbars.value;
      } else {
        globalProperties.musicbars = false;
        visualizerCanvasCtx.clearRect(
          0,
          0,
          visualizerCanvas.width,
          visualizerCanvas.height
        );
      }
    }
  },
  applyGeneralProperties: function (properties) {
    if (Number.isInteger(properties.fps)) {
      fps = properties.fps;
      if (properties.fps === 0) {
        clearInterval(visualizerInterval);
        visualizerInterval = null;
      } else {
        clearInterval(visualizerInterval);
        visualizerInterval = setInterval(onTimerTick, 1000 / fps);
      }
    }
  },
};

// Takes canvas and converts it to an array
const getEncodedCanvasImageData = (canvas, canvasCtx) => {
  let imageData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
  let colorArray = [];

  for (let d = 0; d < imageData.data.length; d += 4) {
    let write = (d / 4) * 3;
    colorArray[write] = imageData.data[d]; // R
    colorArray[write + 1] = imageData.data[d + 1]; // G
    colorArray[write + 2] = imageData.data[d + 2]; // B
    // A
  }

  return String.fromCharCode.apply(null, colorArray);
};

// Writes the image data to the keyboard
const updateCanvas = () => {
  if (
    !globalProperties.keyboardvisualizer &&
    !globalProperties.lightingnodevisualizer
  )
    return;
  // Find the keyboard, its type is CDT_Keyboard as described in the SDK manual
  let keyboard = null;
  let lightingNode = null;

  icueDevices.forEach(function (device) {
    if (device.type === "CDT_Keyboard") {
      keyboard = device;
    }
    if (device.type === "CDT_LightingNodePro") {
      lightingNode = device;
    }
  });

  if (globalProperties.keyboardvisualizer && !!keyboard) {
    let encodedImageData = getEncodedCanvasImageData(
      audioCanvas,
      audioCanvasCtx
    );
    window.cue.setLedColorsByImageData(
      [keyboard.id],
      encodedImageData,
      audioCanvas.width,
      audioCanvas.height
    );
  }
  if (globalProperties.lightingnodevisualizer && !!lightingNode) {
    for (let i = 0; i < fanUpdateList.length; i++) {
      fanUpdateList[i].ledId =
        lightingNode.ledPositions[fanUpdateList[i].ledId].ledId;
    }

    window.cue.setLedsColorsAsync(fanUpdateList);
  }
};

const onTimerTick = () => {
  updateCanvas();
};

// Print the clock
const time = () => {
  let d = new Date();
  let s = d.getSeconds();
  let m = d.getMinutes();
  let h = d.getHours();
  let timeText = `${String(h).padStart(2, "0")}:${String(m).padStart(
    2,
    "0"
  )}:${String(s).padStart(2, "0")}`;
  let clockDisplay = document.getElementById("clock");
  clockDisplay.innerText = timeText;
};

// Get all Corsair devices
const setupDevices = () => {
  if (!icueAvailable) {
    return;
  }

  icueDevices = [];
  // Ask for the total amount of devices
  window.cue.getDeviceCount(function (deviceCount) {
    for (let d = 0; d < deviceCount; ++d) {
      (function (d) {
        // Get device info on each device
        window.cue.getDeviceInfo(d, function (deviceInfo) {
          // Put the ID on the device, useful later on
          deviceInfo.id = d;

          if (!deviceInfo.ledPositions) {
            window.cue.getLedPositionsByDeviceIndex(
              deviceInfo.id,
              function (ledPositions) {
                deviceInfo.ledPositions = ledPositions;
              }
            );
          }
          // Store all our devices in an array
          icueDevices.push(deviceInfo);
        });
      })(d);
    }
  });
};

// Animate background image
const animateImage = (audioArray, bassSound) => {
  // let totalSound = audioArray.reduce((a, b) => a + b, 0) / audioArray.length;

  if (
    globalProperties.backgroundpulse &&
    bassSound >= globalProperties.backgroundpulsethreshold
  ) {
    imgStyle.setProperty(
      "--zoomscale",
      0.02 + Math.pow(globalProperties.backgroundpulseamount * 1.2, bassSound)
    );
  } else {
    imgStyle.setProperty("--zoomscale", 1.02);
  }

  if (
    globalProperties.backgroundflash &&
    bassSound >= globalProperties.backgroundflashthreshold
  ) {
    imgStyle.setProperty(
      "--opacity",
      Math.min(
        globalProperties.opacity + globalProperties.backgroundflashamount,
        1
      )
    );
  } else {
    imgStyle.setProperty("--opacity", Math.min(globalProperties.opacity, 1));
  }

  if (
    globalProperties.backgroundshake &&
    bassSound >= globalProperties.backgroundshakethreshold
  ) {
    imgStyle.setProperty(
      "--rotate",
      `${globalProperties.backgroundshakeamount * (Math.random() * 2 - 1)}deg`
    );
  } else {
    imgStyle.setProperty("--rotate", 0);
  }
};

// Music bars at the bottom of the desktop
const drawVisualizer = (audioArray) => {
  visualizerCanvasCtx.clearRect(
    0,
    0,
    visualizerCanvas.width,
    visualizerCanvas.height
  );
  visualizerCanvasCtx.fillStyle = "white";
  let between = visualizerCanvas.width / 64;
  let offset = 0.5 * globalProperties.barwidth;
  for (let i = 0; i < audioArray.length / 2; i += 2) {
    // Create an audio bar with its hight depending on the audio volume level of the current frequency
    let heightPercent = Math.min(audioArray[i], 1);
    let height = visualizerCanvas.height * heightPercent;
    visualizerCanvasCtx.fillRect(
      (i + 0.5) * between - offset,
      visualizerCanvas.height - height,
      globalProperties.barwidth,
      height
    );
  }
};

const drawKeyboardCanvas = (audioArray) => {
  // 64 bars left, 64 bars right
  // Clear the canvas and set it to black
  audioCanvasCtx.fillStyle = "rgb(0,0,0)";
  audioCanvasCtx.fillRect(0, 0, audioCanvas.width, audioCanvas.height);

  for (let i = 0; i < 6; ++i) {
    let heightPercent = Math.min(
      audioArray[~~(i / 2)] * globalProperties.lightsensitivity,
      1
    );
    let height = audioCanvas.height * heightPercent;
    audioCanvasCtx.fillStyle = `rgb(${Math.min(
      globalProperties.keyboardcolorlow[0] +
        heightPercent *
          (globalProperties.keyboardcolorhigh[0] -
            globalProperties.keyboardcolorlow[0])
    )}, ${Math.min(
      globalProperties.keyboardcolorlow[1] +
        heightPercent *
          (globalProperties.keyboardcolorhigh[1] -
            globalProperties.keyboardcolorlow[1])
    )}, ${Math.min(
      globalProperties.keyboardcolorlow[2] +
        heightPercent *
          (globalProperties.keyboardcolorhigh[2] -
            globalProperties.keyboardcolorlow[2])
    )})`;
    audioCanvasCtx.fillRect(i, audioCanvas.height - height, 1, height);
  }
  for (let i = 0; i < audioArray.length / 2; ++i) {
    // Create an audio bar with its hight depending on the audio volume level of the current frequency
    let heightPercent = Math.min(
      audioArray[i - 3] * globalProperties.lightsensitivity,
      1
    );
    let height = audioCanvas.height * heightPercent;
    audioCanvasCtx.fillStyle = `rgb(${Math.min(
      globalProperties.keyboardcolorlow[0] +
        heightPercent *
          (globalProperties.keyboardcolorhigh[0] -
            globalProperties.keyboardcolorlow[0])
    )}, ${Math.min(
      globalProperties.keyboardcolorlow[1] +
        heightPercent *
          (globalProperties.keyboardcolorhigh[1] -
            globalProperties.keyboardcolorlow[1])
    )}, ${Math.min(
      globalProperties.keyboardcolorlow[2] +
        heightPercent *
          (globalProperties.keyboardcolorhigh[2] -
            globalProperties.keyboardcolorlow[2])
    )})`;
    audioCanvasCtx.fillRect(i, audioCanvas.height - height, 1, height);
  }
};

const createFanUpdateList = (bassSound) => {
  fanUpdateList.length = 0;

  const lightsOn = Math.min(
    globalProperties.lightsensitivity *
      Math.round(bassSound * globalProperties.lightingnodelightcount),
    globalProperties.lightingnodelightcount
  );

  const actualLightsOn =
    bassSound == 0
      ? 0
      : Math.max(lightsOn, globalProperties.lightingnodelightthreshold);

  for (let i = 0; i < globalProperties.lightingnodelightcount; i++) {
    if (globalProperties.lightingnodevisualizer && i < actualLightsOn) {
      fanUpdateList.push({ ledId: i, ...colorWheel[i % 8] });
    } else {
      fanUpdateList.push({ ledId: i, r: 0, g: 0, b: 0 });
    }
  }
};

// Main loop
const wallpaperAudioListener = (audioArray) => {
  // Render bars along the full width of the canvas
  // I took the last 6 bars and made the bass bars wider
  // each bar is 1 pixel

  let bassRange = 6;
  let bassSound = 0;
  for (let i = 0; i < bassRange; ++i) {
    bassSound += audioArray[i];
    bassSound += audioArray[64 + i];
  }
  bassSound = Math.min(1, bassSound / (2 * bassRange));

  if (globalProperties.animatebackground) {
    animateImage(audioArray, bassSound);
  }

  if (globalProperties.musicbars) {
    drawVisualizer(audioArray);
  }

  if (globalProperties.keyboardvisualizer) {
    drawKeyboardCanvas(audioArray);
  }

  if (globalProperties.lightingnodevisualizer) {
    createFanUpdateList(bassSound);
  }
};

// if( !window.wallpaperRegisterAudioListener ) {
// 	var wallpaperAudioInterval = null;
// 	window.wallpaperRegisterAudioListener = function( callback ) {
// 		if( wallpaperAudioInterval ) {
// 			// clear the older interval
// 			clearInterval( _wallpaperAudioInterval );
// 			wallpaperAudioInterval = null;
// 		}

// 		// set new interval
// 		var data = [];
// 		wallpaperAudioInterval = setInterval( function() {
// 			for( var i = 0; i < 128; i++ ){
// 				var v = Math.random() * 1.5; // real data can be above 1 as well
// 				data[i] = v;
// 				data[i]= v;
// 			}
// 			callback( data );
// 		}, 33 ); // wallpaper engine gives audio data back at about 30fps, so 33ms it is
// 	};
// }
if (window.wallpaperRegisterAudioListener) {
  window.wallpaperRegisterAudioListener(wallpaperAudioListener);
}

// Listen for plugins being loaded
window.wallpaperPluginListener = {
  onPluginLoaded: function (name, version) {
    // If the CUE plugin is loaded it means iCUE is available!
    if (name === "cue") {
      // Let the rest of the code know iCUE is available
      icueAvailable = true;
      // Retrieve all iCUE devices
      setupDevices();
    }
  },
};

visualizerInterval = setInterval(onTimerTick, 1000 / fps);
