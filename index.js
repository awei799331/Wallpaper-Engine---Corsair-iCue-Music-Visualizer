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

const toggleClass = (selectorList, className, toggle) => {
  selectorList.forEach((item) => {
    if (toggle) {
      item.classList.add(className);
    } else {
      item.classList.remove(className);
    }
  });
};

class PropertyManager {
  static defaultFps = 20;

  static defaultProperties = {
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
    extrabassbars: 3,
    imagecycledirectory: "",
    imagecycleseconds: 300,
    imageopacity: 0.3,
    initialbackgroundzoom: 0.02,
    keyboardcolorhigh: [0, 0, 255],
    keyboardcolorlow: [255, 0, 0],
    keyboardvisualizer: true,
    lightingnodelightcount: 0,
    lightingnodelightthreshold: 2,
    textcolor: [255, 255, 255],
    lightingnodevisualizer: false,
    lightsensitivity: 1,
    musicbars: true,
  };

  constructor() {
    this.fps = PropertyManager.defaultFps;

    // Clone defaults to avoid shared mutable state between instances
    this.properties = JSON.parse(
      JSON.stringify(PropertyManager.defaultProperties),
    );

    this.timeInterval = null;
    this.visualizerInterval = null;
    this.imageCycleInterval = null;
    this.icueDevices = [];
    this.fanUpdateList = [];

    this.audioCanvas = document.getElementById("keyboardCanvas");
    this.audioCanvasCtx = this.audioCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    this.visualizerCanvas = document.getElementById("visualizer");
    this.visualizerCanvasCtx = this.visualizerCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    this.backgroundImage = document.getElementById("background");
    this.backgroundVideo = document.getElementById("backgroundVideo");
    this.backgroundVideoSrc = document.getElementById("backgroundVideoSrc");
    this.clockDisplay = document.getElementById("clock");
    this.mainImgSelector = document.querySelectorAll(".mainImg");

    // Bind callback for image cycle updates
    this.onImageCycleUpdate = this.onImageCycleUpdate.bind(this);

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
   * Background display helpers
   */

  // Display the default wallpaper.
  // IMPORTANT: This function only changes the visual state.
  // It does NOT clear the user's media properties.
  displayDefaultWallpaper = () => {
    this.stopImageCycle();

    // Set background video to hidden
    this.backgroundVideoSrc.setAttribute("src", "");
    this.backgroundVideo.pause();
    hide(this.backgroundVideo);
    this.backgroundVideo.currentTime = 0;

    // Set default background image
    this.setImageStyles("default_wallpaper.jpg");
    show(this.backgroundImage);
  };

  // Display the selected background image.
  displayBackgroundImage = () => {
    this.stopImageCycle();

    // Hide background video
    this.backgroundVideo.pause();
    hide(this.backgroundVideo);
    this.backgroundVideo.currentTime = 0;
    this.backgroundVideoSrc.setAttribute("src", "");

    // Set background image
    this.setImageStyles(this.properties.backgroundimage);
    show(this.backgroundImage);
  };

  // Display the selected background video.
  displayBackgroundVideo = () => {
    this.stopImageCycle();

    this.backgroundVideoSrc.setAttribute(
      "src",
      this.properties.backgroundvideo,
    );

    this.backgroundVideo.load();
    this.backgroundVideo.currentTime = 0;

    show(this.backgroundVideo);
    hide(this.backgroundImage);

    // The image is not being used
    applyStyle(this.mainImgSelector, "--image", null);

    this.backgroundVideo.play();
  };

  /**
   * Resolve which background should currently be displayed.
   *
   * Priority:
   *   1. Image directory
   *   2. Video
   *   3. Image
   *   4. Default
   *
   * This function is the single source of truth for background selection.
   */
  resolveBackground = () => {
    // Highest priority: image directory
    if (this.properties.imagecycledirectory) {
      this.startImageCycle();
      return;
    }

    // Second priority: video
    if (this.properties.backgroundvideo) {
      this.displayBackgroundVideo();
      return;
    }

    // Third priority: image
    if (this.properties.backgroundimage) {
      this.displayBackgroundImage();
      return;
    }

    // Lowest priority: default
    this.displayDefaultWallpaper();
  };

  // Backwards-compatible helper.
  // This now only displays the default and does not destroy property state.
  changeToDefaultWallpaper = () => {
    this.displayDefaultWallpaper();
  };

  // Helper: set background image URL and initialize base/animated CSS variables
  setImageStyles = (imageUrl) => {
    applyStyle(this.mainImgSelector, "--image", `url(${imageUrl})`);

    const baseZoom = 1 + this.properties.initialbackgroundzoom;

    applyStyle(this.mainImgSelector, "--basezoomscale", baseZoom);
    applyStyle(this.mainImgSelector, "--zoomscale", baseZoom);

    applyStyle(
      this.mainImgSelector,
      "--baseopacity",
      this.properties.imageopacity,
    );

    applyStyle(this.mainImgSelector, "--opacity", this.properties.imageopacity);

    applyStyle(this.mainImgSelector, "--rotate", 0);
  };

  // Animate background image
  animateImage = (audioArray, bassSound) => {
    if (
      this.properties.backgroundpulse &&
      bassSound >= this.properties.backgroundpulsethreshold
    ) {
      toggleClass(this.mainImgSelector, "pulsing", true);

      applyStyle(
        this.mainImgSelector,
        "--zoomscale",
        this.properties.initialbackgroundzoom +
          Math.pow(this.properties.backgroundpulseamount * 1.2, bassSound),
      );
    } else {
      toggleClass(this.mainImgSelector, "pulsing", false);

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
      toggleClass(this.mainImgSelector, "flashing", true);

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
      toggleClass(this.mainImgSelector, "flashing", false);

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
      toggleClass(this.mainImgSelector, "shaking", true);

      applyStyle(
        this.mainImgSelector,
        "--rotate",
        `${this.properties.backgroundshakeamount * (Math.random() * 2 - 1)}deg`,
      );
    } else {
      toggleClass(this.mainImgSelector, "shaking", false);
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

    const [r, g, b] = this.properties.textcolor;

    this.visualizerCanvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;

    const between = this.visualizerCanvas.width / 64;
    const offset = 0.5 * this.properties.barwidth;

    for (let i = 0; i < audioArray.length / 2; i += 2) {
      // Create an audio bar with its height depending on
      // the audio volume level of the current frequency
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

    // Draw double thick bass bars for better irl lighting
    for (let i = 0; i < this.properties.extrabassbars; ++i) {
      const heightPercent = Math.min(
        Math.max(audioArray[i], audioArray[i + 1]) *
          this.properties.lightsensitivity *
          1.5,
        1,
      );

      const height = this.audioCanvas.height * heightPercent;

      this.audioCanvasCtx.fillStyle = `rgb(${Math.floor(
        this.properties.keyboardcolorlow[0] +
          heightPercent *
            (this.properties.keyboardcolorhigh[0] -
              this.properties.keyboardcolorlow[0]),
      )}, ${Math.floor(
        this.properties.keyboardcolorlow[1] +
          heightPercent *
            (this.properties.keyboardcolorhigh[1] -
              this.properties.keyboardcolorlow[1]),
      )}, ${Math.floor(
        this.properties.keyboardcolorlow[2] +
          heightPercent *
            (this.properties.keyboardcolorhigh[2] -
              this.properties.keyboardcolorlow[2]),
      )})`;

      this.audioCanvasCtx.fillRect(
        i * 2,
        this.audioCanvas.height - height,
        2,
        height,
      );
    }

    // Draw other bars
    for (
      let i = this.properties.extrabassbars * 2;
      i < audioArray.length / 2;
      ++i
    ) {
      const heightPercent = Math.min(
        audioArray[i - this.properties.extrabassbars] *
          this.properties.lightsensitivity,
        1,
      );

      const height = this.audioCanvas.height * heightPercent;

      this.audioCanvasCtx.fillStyle = `rgb(${Math.floor(
        this.properties.keyboardcolorlow[0] +
          heightPercent *
            (this.properties.keyboardcolorhigh[0] -
              this.properties.keyboardcolorlow[0]),
      )}, ${Math.floor(
        this.properties.keyboardcolorlow[1] +
          heightPercent *
            (this.properties.keyboardcolorhigh[1] -
              this.properties.keyboardcolorlow[1]),
      )}, ${Math.floor(
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
        this.fanUpdateList.push({
          ledId: i,
          ...colorWheel[i % 8],
        });
      } else {
        this.fanUpdateList.push({
          ledId: i,
          r: 0,
          g: 0,
          b: 0,
        });
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
    if (property.value) {
      let decoded = property.value;

      try {
        decoded = decodeURIComponent(property.value);
      } catch (e) {
        // keep raw value on decode error
      }

      this.properties.backgroundimage = `file:///${decoded}`;
    } else {
      // Only clear the image property.
      // Do NOT switch to the default here.
      this.properties.backgroundimage = "";
    }
  };

  handleBackgroundVideoChange = (property) => {
    if (property.value) {
      this.properties.backgroundvideo =
        "file:///" + decodeURIComponent(property.value);
    } else {
      // Only clear the video property.
      // Do NOT switch to the default here.
      this.properties.backgroundvideo = "";
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

    applyStyle(
      this.mainImgSelector,
      "--baseopacity",
      this.properties.imageopacity,
    );
  };

  handleInitialBackgroundZoomChange = (property) => {
    this.properties.initialbackgroundzoom = property.value ?? 0;

    applyStyle(
      this.mainImgSelector,
      "--basezoomscale",
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

    if (this.properties.keyboardvisualizer && this.visualizerInterval != null) {
      // Run at this.fps frames per second
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
    if (property.value) {
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

  handleTextColorChange = (property) => {
    const textcolor = property.value.split(" ").map((c) => {
      return Math.round(c * 255);
    });

    if (textcolor.length === 3) {
      this.properties.textcolor = textcolor;

      applyStyle(
        [this.clockDisplay],
        "color",
        `rgb(${textcolor[0]}, ${textcolor[1]}, ${textcolor[2]})`,
      );
    }
  };

  handleImageCycleDirectoryChange = (property) => {
    // Only update the stored property here.
    // Background resolution is handled centrally.
    this.stopImageCycle();

    this.properties.imagecycledirectory =
      property && property.value ? property.value : "";
  };

  handleImageCycleSecondsChange = (property) => {
    this.stopImageCycle();

    this.properties.imagecycleseconds = property.value;
  };

  startImageCycle = () => {
    if (!this.properties.imagecycledirectory) return;

    if (typeof window.wallpaperRequestRandomFileForProperty !== "function")
      return;

    // Prevent duplicate intervals if resolveBackground()
    // is called multiple times while the directory is active.
    if (this.imageCycleInterval !== null) return;

    // Load first image immediately
    try {
      window.wallpaperRequestRandomFileForProperty(
        "imagecycledirectory",
        this.onImageCycleUpdate,
      );
    } catch (e) {
      // Fail silently if the API call errors
      return;
    }

    // Set up interval for cycling
    // Property is in seconds.
    const secs = Number(
      this.properties.imagecycleseconds ??
        this.properties.imagecycleminutes ??
        300,
    );

    if (!Number.isFinite(secs) || secs <= 0) return;

    const intervalMs = Math.max(1000, Math.floor(secs * 1000));

    try {
      this.imageCycleInterval = setInterval(() => {
        // Check again in case the property was cleared.
        if (!this.properties.imagecycledirectory) {
          this.stopImageCycle();
          return;
        }

        try {
          window.wallpaperRequestRandomFileForProperty(
            "imagecycledirectory",
            this.onImageCycleUpdate,
          );
        } catch (e) {
          // ignore errors during periodic requests
        }
      }, intervalMs);
    } catch (e) {
      // if setInterval or other fails, don't crash
      this.imageCycleInterval = null;
    }
  };

  stopImageCycle = () => {
    if (this.imageCycleInterval !== null) {
      clearInterval(this.imageCycleInterval);
      this.imageCycleInterval = null;
    }
  };

  onImageCycleUpdate = (propertyName, filePath) => {
    try {
      // Ignore stale callbacks after the directory has been cleared.
      if (!this.properties.imagecycledirectory) return;

      if (!filePath) return;

      const img = new Image();

      // Make sure we handle encoded paths from Wallpaper Engine,
      // but tolerate decode errors.
      let decodedPath = filePath;

      try {
        decodedPath = decodeURIComponent(filePath);
      } catch (e) {
        // keep original filePath if decode fails
      }

      const src = `file:///${decodedPath}`;

      img.onload = () => {
        try {
          // Ignore the callback if the directory was cleared
          // while this image was loading.
          if (!this.properties.imagecycledirectory) return;

          // Also make sure directory is still the highest-priority
          // active source before displaying the image.
          if (
            this.properties.backgroundvideo ||
            this.properties.backgroundimage
          ) {
            // Directory still has highest priority, so this is okay.
          }

          applyStyle(this.mainImgSelector, "--image", `url(${img.src})`);

          show(this.backgroundImage);
          hide(this.backgroundVideo);
        } catch (e) {
          // ignore styling errors
        }
      };

      img.onerror = () => {
        // silently ignore failed image loads
      };

      // Start loading the image
      try {
        img.src = src;
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // top-level guard: do not allow any exception to bubble up
    }
  };

  /**
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
    imagecycledirectory: "handleImageCycleDirectoryChange",
    imagecycleseconds: "handleImageCycleSecondsChange",
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
    textcolor: "handleTextColorChange",
  };

  /**
   * Handler methods for each property
   *
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
   * Handles making changes to properties based on the
   * Web Wallpaper Properties object.
   *
   * Media properties are updated first, then the background
   * is resolved ONCE using the complete current state.
   *
   * Priority:
   * directory > video > image > default
   *
   * @param properties
   */
  handlePropertiesObject = (properties) => {
    const mediaKeys = new Set([
      "imagecycledirectory",
      "backgroundvideo",
      "backgroundimage",
    ]);

    let mediaChanged = false;

    for (const slug in properties) {
      if (!properties.hasOwnProperty(slug)) continue;

      this.handlePropertyChange(slug, properties[slug]);

      if (mediaKeys.has(slug)) {
        mediaChanged = true;
      }
    }

    // Resolve the background once after all properties
    // in this update have been applied.
    if (mediaChanged) {
      this.resolveBackground();
    }
  };

  /**
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

const manager = new PropertyManager();

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

if (
  window.wallpaperRegisterAudioListener !== null &&
  window.wallpaperRegisterAudioListener !== undefined
) {
  window.wallpaperRegisterAudioListener(wallpaperAudioListener);
}

// Listen for plugins being loaded
window.wallpaperPluginListener = {
  onPluginLoaded: (name, version) => {
    // If the CUE plugin is loaded it means iCUE is available!
    if (name === "cue") {
      manager.setupDevices();
    }
  },
};
