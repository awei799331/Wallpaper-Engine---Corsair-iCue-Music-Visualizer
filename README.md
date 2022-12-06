# Wallpaper Engine - Corsair iCue Music Visualizer
A customizable web wallpaper with built-in clock and audio visualizer that syncs with Corsair keyboards compatible with iCue.
Tested working on Wallpaper Engine, other desktop wallpaper applications may not work.

![image](https://user-images.githubusercontent.com/47440214/205839276-3957ff81-e0fa-46b6-b6c5-2649a84cf47e.png)

The music visualizer is for Corsair keyboards with support for iCue. I don't own a Razer keyboard, so there will not be Chroma support unfortunately. If you do not own a Corsair keyboard, be sure to turn off the `Keyboard Visualizer` property for better performance.

If you choose to upload your own background, make sure to not rename or move the file, or you would have to reupload it again.
Please respect artists' IP and DO NOT USE OR DISTRIBUTE PRIVATELY OR COMMERCIALLY without proper consent from artists!

# Customizable Properties
All background animations react to bass intensity of only the LEFT AUDIO CHANNEL.
Users are encouraged to tweak their animation thresholds for best experience since the best values will vary between devices.

- Animate Background: Toggles all background animations on the desktop
- Background Flash: Toggles audio-reactive background flash/strobing animation
- Background Flash Amount: Changes the flash brightness, maxes out at 100% image opacity
- Background Flash Threshold: Changes the minimum intensity of audio to trigger the animation
- Background Image: No explanation needed
- Background Position X: A slider to reposition the center of the background for images with different dimensions. Note that only the longer dimension will move
- Background Position Y: A slider to reposition the center of the background for images with different dimensions. Note that only the longer dimension will move
- Background Pulse: Toggles audio-reactive background pulse/bounce animation
- Background Pulse Amount: Changes the amount of zoom of the pulse animation
- Background Pulse Threshold: Changes the minumum intensity of audio to trigger the animation
- Background Shake: Toggles audio-reactive rocking of the background image
- Background Shake Amount: Changes the amount of rocking. Scale is multiplied by 0.5 degrees of turn
- Background Shake Threshold: Changes the minimum intensity of audio to trigger the animation
- Bar Width: Changes the width of the desktop music bars in pixels
- Keyboard Color High: Changes the linear gradient of bars on the keyboard visualizer for high intensity
- Keyboard Color Low: Changes the linear gradient of bars on the keyboard visualizer for low intensity
- Keyboard Sensitivity: Scales the bar heights for the keyboard visualizer 
- Keyboard Visualizer: Toggles the keyboard RGB LED visualizer. Note that due to how the Corsair iCue SDK works, the wallpaper overrides all existing configurations in iCue, so turning off the visualizer will turn off all backlight LEDs of the keyboard.
- Music Bars: Toggles music bar visualizer at the bottom of the wallpaper
- Opacity: Initial opacity of the image. Also affects background flash amount as the values are additive

## Performance
GPU usage (RTX 3060 Ti):
Max settings: 25% at ~500MHz / 1710MHz.
No background animations: 10% of ~500MHz / 1710 MHz.
Clock only: GPU load 3% of of ~200MHz / 1710 MHz.

## Changelog
See CHANGELOG.md
