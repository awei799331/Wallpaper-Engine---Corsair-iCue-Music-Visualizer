const hide = (el) => {
  el.classList.add("hidden");
  el.classList.remove("visible");
};

const show = (el) => {
  el.classList.add("visible");
  el.classList.remove("hidden");
};

const applyStyle = (selectorList, variable, value) => {
  selectorList.forEach((item) => {
    item.style.setProperty(variable, value);
  });
};

class PropertyManager {
  constructor({ defaultProperties, fps }) {
    this.fps = fps;
    this.properties = defaultProperties;
    this.timeInterval = null;
    this.visualizerInterval = null;
    this.icueDevices = [];

    this.audioCanvas = document.getElementById("keyboardCanvas");
    this.audioCanvasCtx = this.audioCanvas.getContext("2d");

    this.fanUpdateList = [];

    this.visualizerCanvas = document.getElementById("visualizer");
    this.visualizerCanvasCtx = this.visualizerCanvas.getContext("2d");

    this.backgroundImage = document.getElementById("background");
    this.backgroundVideo = document.getElementById("backgroundVideo");
    this.backgroundVideoSrc = document.getElementById("backgroundVideoSrc");

    this.clockDisplay = document.getElementById("clock");

    this.mainImgSelector = document.querySelectorAll(".mainImg");

    if (this.clockDisplay && this.properties.clock) {
      this.timeInterval = setInterval(this.time, 1000);
    }
  }

  // Print the clock
  static getTimeString() {
    const d = new Date();
    const s = d.getSeconds();
    const m = d.getMinutes();
    const h = d.getHours();
    const timeText = `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0",
    )}:${String(s).padStart(2, "0")}`;
    return timeText;
  }

  time = () => {
    const timeString = PropertyManager.getTimeString();
    this.clockDisplay.innerText = timeString;
  };

  /**
   * Useful helper functions
   */
  changeToDefaultWallpaper = () => {
    const defaultWallpaper = "default_wallpaper.jpg";
    this.properties.backgroundvideo = "";
    this.properties.backgroundimage = "";

    // set background video to hidden
    this.backgroundVideoSrc.setAttribute("src", "");
    this.backgroundVideo.pause();
    hide(backgroundVideo);
    this.backgroundVideo.currentTime = 0;
    // set image
    applyStyle(this.mainImgSelector, "--image", `url(${defaultWallpaper})`);
    show(this.backgroundImage);
  };

  // Animate background image
  animateImage = (audioArray, bassSound) => {
    // let totalSound = audioArray.reduce((a, b) => a + b, 0) / audioArray.length;

    if (
      this.properties.backgroundpulse &&
      bassSound >= this.properties.backgroundpulsethreshold
    ) {
      applyStyle(
        this.mainImgSelector,
        "--zoomscale",
        this.properties.initialbackgroundzoom +
          Math.pow(this.properties.backgroundpulseamount * 1.2, bassSound),
      );
    } else {
      applyStyle(
        this.mainImgSelector,
        "--zoomscale",
        1 + this.properties.initialbackgroundzoom,
      );
    }

    if (
      this.properties.backgroundflash &&
      bassSound >= this.properties.backgroundflashthreshold
    ) {
      applyStyle(
        this.mainImgSelector,
        "--opacity",
        Math.min(
          Math.round(
            (this.properties.imageopacity +
              this.properties.backgroundflashamount) *
              10,
          ) / 10,
          1,
        ),
      );
    } else {
      applyStyle(
        this.mainImgSelector,
        "--opacity",
        Math.min(this.properties.imageopacity, 1),
      );
    }

    if (
      this.properties.backgroundshake &&
      bassSound >= this.properties.backgroundshakethreshold
    ) {
      applyStyle(
        this.mainImgSelector,
        "--rotate",
        `${this.properties.backgroundshakeamount * (Math.random() * 2 - 1)}deg`,
      );
    } else {
      applyStyle(this.mainImgSelector, "--rotate", 0);
    }
  };

  // Music bars at the bottom of the desktop
  drawVisualizer = (audioArray) => {
    this.visualizerCanvasCtx.clearRect(
      0,
      0,
      this.visualizerCanvas.width,
      this.visualizerCanvas.height,
    );
    this.visualizerCanvasCtx.fillStyle = "white";
    const between = this.visualizerCanvas.width / 64;
    const offset = 0.5 * this.properties.barwidth;
    for (let i = 0; i < audioArray.length / 2; i += 2) {
      // Create an audio bar with its hight depending on the audio volume level of the current frequency
      const heightPercent = Math.min(audioArray[i], 1);
      const height = this.visualizerCanvas.height * heightPercent;
      this.visualizerCanvasCtx.fillRect(
        (i + 0.5) * between - offset,
        this.visualizerCanvas.height - height,
        this.properties.barwidth,
        height,
      );
    }
  };

  drawKeyboardCanvas = (audioArray) => {
    // 64 bars left, 64 bars right
    // Clear the canvas and set it to black
    this.audioCanvasCtx.fillStyle = "rgb(0,0,0)";
    this.audioCanvasCtx.fillRect(
      0,
      0,
      this.audioCanvas.width,
      this.audioCanvas.height,
    );

    for (let i = 0; i < 6; ++i) {
      const heightPercent = Math.min(
        audioArray[~~(i / 2)] * this.properties.lightsensitivity,
        1,
      );
      const height = this.audioCanvas.height * heightPercent;
      this.audioCanvasCtx.fillStyle = `rgb(${Math.min(
        this.properties.keyboardcolorlow[0] +
          heightPercent *
            (this.properties.keyboardcolorhigh[0] -
              this.properties.keyboardcolorlow[0]),
      )}, ${Math.min(
        this.properties.keyboardcolorlow[1] +
          heightPercent *
            (this.properties.keyboardcolorhigh[1] -
              this.properties.keyboardcolorlow[1]),
      )}, ${Math.min(
        this.properties.keyboardcolorlow[2] +
          heightPercent *
            (this.properties.keyboardcolorhigh[2] -
              this.properties.keyboardcolorlow[2]),
      )})`;
      this.audioCanvasCtx.fillRect(
        i,
        this.audioCanvas.height - height,
        1,
        height,
      );
    }
    for (let i = 0; i < audioArray.length / 2; ++i) {
      // Create an audio bar with its hight depending on the audio volume level of the current frequency
      const heightPercent = Math.min(
        audioArray[i - 3] * this.properties.lightsensitivity,
        1,
      );
      const height = this.audioCanvas.height * heightPercent;
      this.audioCanvasCtx.fillStyle = `rgb(${Math.min(
        this.properties.keyboardcolorlow[0] +
          heightPercent *
            (this.properties.keyboardcolorhigh[0] -
              this.properties.keyboardcolorlow[0]),
      )}, ${Math.min(
        this.properties.keyboardcolorlow[1] +
          heightPercent *
            (this.properties.keyboardcolorhigh[1] -
              this.properties.keyboardcolorlow[1]),
      )}, ${Math.min(
        this.properties.keyboardcolorlow[2] +
          heightPercent *
            (this.properties.keyboardcolorhigh[2] -
              this.properties.keyboardcolorlow[2]),
      )})`;
      this.audioCanvasCtx.fillRect(
        i,
        this.audioCanvas.height - height,
        1,
        height,
      );
    }
  };

  createFanUpdateList = (bassSound) => {
    this.fanUpdateList = [];

    const lightsOn = Math.min(
      this.properties.lightsensitivity *
        Math.round(bassSound * this.properties.lightingnodelightcount),
      this.properties.lightingnodelightcount,
    );

    const actualLightsOn =
      bassSound == 0
        ? 0
        : Math.max(lightsOn, this.properties.lightingnodelightthreshold);

    for (let i = 0; i < this.properties.lightingnodelightcount; i++) {
      if (this.properties.lightingnodevisualizer && i < actualLightsOn) {
        this.fanUpdateList.push({ ledId: i, ...colorWheel[i % 8] });
      } else {
        this.fanUpdateList.push({ ledId: i, r: 0, g: 0, b: 0 });
      }
    }
  };

  // Takes canvas and converts it to an array
  static getEncodedCanvasImageData(canvas, canvasCtx) {
    const imageData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
    const colorArray = [];

    for (let d = 0; d < imageData.data.length; d += 4) {
      const write = (d / 4) * 3;
      colorArray[write] = imageData.data[d]; // R
      colorArray[write + 1] = imageData.data[d + 1]; // G
      colorArray[write + 2] = imageData.data[d + 2]; // B
      // A
    }

    return String.fromCharCode.apply(null, colorArray);
  }

  // Writes the image data to the keyboard
  updateCanvas = () => {
    if (
      !this.properties.keyboardvisualizer &&
      !this.properties.lightingnodevisualizer
    )
      return;
    // Find the keyboard, its type is CDT_Keyboard as described in the SDK manual
    let keyboard = null;
    let lightingNode = null;

    this.icueDevices.forEach(function (device) {
      if (device.type === "CDT_Keyboard") {
        keyboard = device;
      }
      if (device.type === "CDT_LightingNodePro") {
        lightingNode = device;
      }
    });

    if (this.properties.keyboardvisualizer && !!keyboard) {
      const encodedImageData = PropertyManager.getEncodedCanvasImageData(
        this.audioCanvas,
        this.audioCanvasCtx,
      );
      window.cue.setLedColorsByImageData(
        [keyboard.id],
        encodedImageData,
        this.audioCanvas.width,
        this.audioCanvas.height,
      );
    }
    if (this.properties.lightingnodevisualizer && !!lightingNode) {
      for (let i = 0; i < this.fanUpdateList.length; i++) {
        this.fanUpdateList[i].ledId =
          lightingNode.ledPositions[this.fanUpdateList[i].ledId].ledId;
      }

      window.cue.setLedsColorsAsync(this.fanUpdateList);
    }
  };

  // Get all Corsair devices
  setupDevices = () => {
    this.icueDevices = [];
    // Ask for the total amount of devices
    window.cue.getDeviceCount((deviceCount) => {
      for (let d = 0; d < deviceCount; ++d) {
        // Get device info on each device
        window.cue.getDeviceInfo(d, (deviceInfo) => {
          // Put the ID on the device, useful later on
          deviceInfo.id = d;

          if (!deviceInfo.ledPositions) {
            window.cue.getLedPositionsByDeviceIndex(
              deviceInfo.id,
              (ledPositions) => {
                deviceInfo.ledPositions = ledPositions;
              },
            );
          }
          // Store all our devices in an array
          this.icueDevices.push(deviceInfo);
        });
      }
    });
  };

  /**
   * Handler methods
   */

  handleAnimateBackgroundChange = (property) => {
    this.properties.animatebackground = property.value;
    if (!property.value) {
      this.properties.animatebackground = false;
      applyStyle(
        this.mainImgSelector,
        "--zoomscale",
        1 + this.properties.initialbackgroundzoom,
      );
      applyStyle(
        this.mainImgSelector,
        "--opacity",
        this.properties.imageopacity,
      );
      applyStyle(this.mainImgSelector, "--rotate", 0);
    }
  };

  handleBackgroundFlashChange = (property) => {
    this.properties.backgroundflash = property.value;
    if (!this.properties.backgroundflash) {
      applyStyle(
        this.mainImgSelector,
        "--opacity",
        this.properties.imageopacity,
      );
    }
  };

  handleBackgroundFlashAmountChange = (property) => {
    this.properties.backgroundflashamount = property.value;
  };

  handleBackgroundFlashThresholdChange = (property) => {
    this.properties.backgroundflashthreshold = property.value;
  };

  handleBackgroundImageChange = (property) => {
    if (this.properties.backgroundvideo) {
      return;
    }

    if (property.value) {
      this.properties.backgroundimage = `file:///${property.value}`;
      this.properties.backgroundvideo = "";

      // set background video to none
      this.backgroundVideo.pause();
      hide(backgroundVideo);
      this.backgroundVideo.currentTime = 0;
      // set background image
      applyStyle(
        this.mainImgSelector,
        "--image",
        `url(${this.properties.backgroundimage})`,
      );
      show(this.backgroundImage);
    } else {
      this.changeToDefaultWallpaper();
    }
  };

  handleBackgroundVideoChange = (property) => {
    if (this.properties.backgroundimage) {
      return;
    }

    if (property.value) {
      this.properties.backgroundvideo =
        "file:///" + decodeURIComponent(property.value);
      this.properties.backgroundimage = "";
      // set background video
      this.backgroundVideoSrc.setAttribute(
        "src",
        this.properties.backgroundvideo,
      );
      this.backgroundVideo.load();
      this.backgroundVideo.currentTime = 0;
      show(backgroundVideo);
      this.backgroundVideo.play();
      // set image to hidden
      hide(this.backgroundImage);
      applyStyle(this.mainImgSelector, "--image", null);
    } else {
      this.changeToDefaultWallpaper();
    }
  };

  handleBackgroundPositionXChange = (property) => {
    this.properties.backgroundpositionx = property.value;
    applyStyle(
      this.mainImgSelector,
      "--positionx",
      `${this.properties.backgroundpositionx}%`,
    );
  };

  handleBackgroundPositionYChange = (property) => {
    this.properties.backgroundpositiony = property.value;
    applyStyle(
      this.mainImgSelector,
      "--positiony",
      `${this.properties.backgroundpositiony}%`,
    );
  };

  handleBackgroundPulseChange = (property) => {
    this.properties.backgroundpulse = property.value;
    if (!this.properties.backgroundpulse) {
      applyStyle(
        this.mainImgSelector,
        "--zoomscale",
        1 + this.properties.initialbackgroundzoom,
      );
    }
  };

  handleBackgroundPulseAmountChange = (property) => {
    this.properties.backgroundpulseamount = property.value;
  };

  handleBackgroundPulseThresholdChange = (property) => {
    this.properties.backgroundpulsethreshold = property.value;
  };

  handleBackgroundShakeChange = (property) => {
    this.properties.backgroundshake = property.value;
    if (!this.properties.backgroundshake) {
      applyStyle(this.mainImgSelector, "--rotate", 0);
    }
  };

  handleBackgroundShakeAmountChange = (property) => {
    this.properties.backgroundshakeamount = property.value;
  };

  handleBackgroundShakeThresholdChange = (property) => {
    this.properties.backgroundshakethreshold = property.value;
  };

  handleBarWidthChange = (property) => {
    this.properties.barwidth = property.value;
  };

  handleClockChange = (property) => {
    this.properties.clock = property.value;
    if (this.properties.clock && !this.timeInterval) {
      this.timeInterval = setInterval(this.time, 1000);
    } else if (!this.properties.clock && this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = null;
      this.clockDisplay.innerText = "";
    }
  };

  handleExperimentalSettingsChange = (property) => {
    this.properties.experimentalsettings = property.value;
    if (!this.properties.experimentalsettings) {
      this.properties.lightingnodevisualizer = false;
      this.audioCanvasCtx.clearRect(
        0,
        0,
        this.audioCanvas.width,
        this.audioCanvas.height,
      );
      this.updateCanvas();
    }
  };

  handleImageOpacityChange = (property) => {
    this.properties.imageopacity = property.value;
    applyStyle(this.mainImgSelector, "--opacity", this.properties.imageopacity);
  };

  handleInitialBackgroundZoomChange = (property) => {
    this.properties.initialbackgroundzoom = property.value ?? 0;
    applyStyle(
      this.mainImgSelector,
      "--zoomscale",
      1 + this.properties.initialbackgroundzoom,
    );
  };

  handleKeyboardColorHighChange = (property) => {
    const keyboardcolorhigh = property.value.split(" ").map((c) => {
      return Math.ceil(c * 255);
    });
    if (keyboardcolorhigh.length === 3)
      this.properties.keyboardcolorhigh = keyboardcolorhigh;
  };

  handleKeyboardColorLowChange = (property) => {
    const keyboardcolorlow = property.value.split(" ").map((c) => {
      return Math.round(c * 255);
    });
    if (keyboardcolorlow.length === 3)
      this.properties.keyboardcolorlow = keyboardcolorlow;
  };

  handleKeyboardVisualizerChange = (property) => {
    this.properties.keyboardvisualizer = property.value;
    if (this.properties.keyboardvisualizer && visualizerInterval != null) {
      // Run at `this.fps` frames per second
    } else {
      this.fanUpdateList = [];
      this.updateCanvas();
    }
  };

  handleLightingNodeLightCountChange = (property) => {
    this.properties.lightingnodelightcount = property.value;
  };

  handleLightingNodeLightThresholdChange = (property) => {
    this.properties.lightingnodelightthreshold = property.value;
  };

  handleLightingNodeVisualizerChange = (property) => {
    this.properties.lightingnodevisualizer = property.value;
    if (
      !this.properties.lightingnodevisualizer ||
      this.visualizerInterval === null
    ) {
      this.audioCanvasCtx.clearRect(
        0,
        0,
        this.audioCanvas.width,
        this.audioCanvas.height,
      );
      this.updateCanvas();
    }
  };

  handleLightSensitivityChange = (property) => {
    this.properties.lightsensitivity = property.value;
  };

  handleMusicBarsChange = (property) => {
    if (properties.musicbars.value) {
      this.properties.musicbars = property.value;
    } else {
      this.properties.musicbars = false;
      this.visualizerCanvasCtx.clearRect(
        0,
        0,
        this.visualizerCanvas.width,
        this.visualizerCanvas.height,
      );
    }
  };

  /**
   * @static
   * Constant map of slugs to handlers
   */
  static handlerMap = {
    animatebackground: "handleAnimateBackgroundChange",
    backgroundflash: "handleBackgroundFlashChange",
    backgroundflashamount: "handleBackgroundFlashAmountChange",
    backgroundflashthreshold: "handleBackgroundFlashThresholdChange",
    backgroundimage: "handleBackgroundImageChange",
    backgroundpositionx: "handleBackgroundPositionXChange",
    backgroundpositiony: "handleBackgroundPositionYChange",
    backgroundpulse: "handleBackgroundPulseChange",
    backgroundpulseamount: "handleBackgroundPulseAmountChange",
    backgroundpulsethreshold: "handleBackgroundPulseThresholdChange",
    backgroundshake: "handleBackgroundShakeChange",
    backgroundshakeamount: "handleBackgroundShakeAmountChange",
    backgroundshakethreshold: "handleBackgroundShakeThresholdChange",
    backgroundvideo: "handleBackgroundVideoChange",
    barwidth: "handleBarWidthChange",
    clock: "handleClockChange",
    experimentalsettings: "handleExperimentalSettingsChange",
    initialbackgroundzoom: "handleInitialBackgroundZoomChange",
    keyboardcolorhigh: "handleKeyboardColorHighChange",
    keyboardcolorlow: "handleKeyboardColorLowChange",
    lightsensitivity: "handleLightSensitivityChange",
    keyboardvisualizer: "handleKeyboardVisualizerChange",
    lightingnodelightcount: "handleLightingNodeLightCountChange",
    lightingnodelightthreshold: "handleLightingNodeLightThresholdChange",
    lightingnodevisualizer: "handleLightingNodeVisualizerChange",
    musicbars: "handleMusicBarsChange",
    imageopacity: "handleImageOpacityChange",
  };

  /**
   * Handler methods for each property
   * @param slug
   * @param property
   */
  handlePropertyChange = (slug, property) => {
    const handlerName = PropertyManager.handlerMap[slug];
    const handler = this[handlerName];

    if (!!handler && typeof handler === "function" && !!property) {
      handler.call(this, property);
    }
  };

  /**
   * Handles making changes to properties based on the Web Wallpaper Properties object
   * See https://docs.wallpaperengine.io/en/web/customization/properties.html#creating-user-properties for spec
   * @param properties
   */
  handlePropertiesObject = (properties) => {
    for (const slug in properties) {
      if (properties.hasOwnProperty(slug)) {
        this.handlePropertyChange(slug, properties[slug]);
      }
    }
  };

  /**
   *
   * @param number fps
   */
  handleFpsChange = (fps) => {
    clearInterval(this.visualizerInterval);
    this.fps = fps;
    if (this.fps === 0) {
      this.visualizerInterval = null;
    } else {
      this.visualizerInterval = setInterval(this.updateCanvas, 1000 / this.fps);
    }
  };
}

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
const defaultFps = 20;
const defaultProperties = {
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
  backgroundvideo: null,
  barwidth: 4,
  clock: true,
  experimentalsettings: false,
  initialbackgroundzoom: 0.02,
  keyboardcolorhigh: [0, 0, 255],
  keyboardcolorlow: [255, 0, 0],
  lightsensitivity: 1,
  keyboardvisualizer: true,
  lightingnodelightcount: 0,
  lightingnodelightthreshold: 2,
  lightingnodevisualizer: false,
  musicbars: true,
  imageopacity: 0.3,
};

const manager = new PropertyManager({
  defaultProperties,
  defaultFps,
});

window.wallpaperPropertyListener = {
  applyUserProperties: (properties) => {
    manager.handlePropertiesObject(properties);
  },
  applyGeneralProperties: function (properties) {
    const { fps } = properties;
    if (Number.isInteger(fps)) {
      manager.handleFpsChange(fps);
    }
  },
};

// Main loop
const wallpaperAudioListener = (audioArray) => {
  // Render bars along the full width of the canvas
  // I took the last 6 bars and made the bass bars wider
  // each bar is 1 pixel

  const bassRange = 6;
  let bassSound = 0;
  for (let i = 0; i < bassRange; ++i) {
    bassSound += audioArray[i];
    bassSound += audioArray[64 + i];
  }
  bassSound = Math.min(1, bassSound / (2 * bassRange));

  if (manager.properties.animatebackground) {
    manager.animateImage(audioArray, bassSound);
  }

  if (manager.properties.musicbars) {
    manager.drawVisualizer(audioArray);
  }

  if (manager.properties.keyboardvisualizer) {
    manager.drawKeyboardCanvas(audioArray);
  }

  if (manager.properties.lightingnodevisualizer) {
    manager.createFanUpdateList(bassSound);
  }
};

if (window.wallpaperRegisterAudioListener) {
  window.wallpaperRegisterAudioListener(wallpaperAudioListener);
}

// Listen for plugins being loaded
window.wallpaperPluginListener = {
  onPluginLoaded: (name, version) => {
    // If the CUE plugin is loaded it means iCUE is available!
    if (name === "cue") {
      // Retrieve all iCUE devices
      manager.setupDevices();
    }
  },
};

manager.handleFpsChange(manager.fps);
