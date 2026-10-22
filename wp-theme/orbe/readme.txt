=== Orbe ===
Contributors: orbestudio
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Immersive WebGL portfolio theme for creative agencies and studios.

== Description ==

Orbe brings award-style WebGL interactions to WordPress without code:

* Three hero scenes built with Three.js: liquid blob, particle sphere, flowing gradient.
* Fullscreen navigation that reveals each item's image with a WebGL distortion (wave, RGB shift, liquid).
* Projects grid rendered in WebGL: images bend with the scroll speed and tilt towards the cursor.
* Scattered editorial grid, regular grid or list, with a visitor switch.
* Smooth scrolling (Lenis), custom cursor, preloader and page transitions.
* Everything is configurable in Appearance → Customize → Orbe Options.
* Accessible fallbacks: no WebGL, no JavaScript or "reduce motion" all show a clean static site.

== Installation ==

1. Appearance → Themes → Add New → Upload Theme, choose orbe.zip, then Activate.
2. Install the recommended "Orbe Core" plugin when prompted (adds the Projects post type).
3. Add projects in Projects → Add New, with a featured image.
4. Create a menu in Appearance → Menus and assign it to "Primary navigation".
   Each menu item shows the featured image of its page or project in the WebGL menu,
   or the image URL set on the menu item.
5. Tune the effects in Appearance → Customize → Orbe Options.

== Frequently Asked Questions ==

= The WebGL effects do not show =
They are disabled for visitors who ask their system for reduced motion and on devices
without WebGL; the regular images are shown instead. Images hosted on another domain need
CORS headers to be used as WebGL textures.

= How do I rebuild the JavaScript? =
Sources are in src/js. Run `npm install` then `npm run build` from the development package.

== Changelog ==

= 1.0.0 =
* Initial release.

== Credits ==

* Three.js — MIT License — https://threejs.org
* Lenis — MIT License — https://github.com/darkroomengineering/lenis
* simplex noise GLSL (Ashima Arts, Stefan Gustavson) — MIT License
* TGM Plugin Activation — GPLv2 or later — http://tgmpluginactivation.com
* Cormorant Garamond, EB Garamond — SIL Open Font License 1.1 (assets/fonts/OFL.txt)
* Screenshot artwork generated for this theme — GPLv2 or later
