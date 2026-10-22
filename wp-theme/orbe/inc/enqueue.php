<?php
/**
 * Styles, scripts and the front-end configuration.
 *
 * Two bundles are built from src/js:
 * - orbe-main  : smooth scroll, menu, cursor, preloader, transitions (no dependencies).
 * - orbe-webgl : Three.js scenes, only loaded when at least one WebGL feature is enabled.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Asset version: file modification time in debug mode, theme version otherwise.
 *
 * @param string $relative Path relative to the theme root.
 * @return string
 */
function orbe_asset_version( $relative ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG && file_exists( ORBE_DIR . '/' . $relative ) ) {
		return (string) filemtime( ORBE_DIR . '/' . $relative );
	}
	return ORBE_VERSION;
}

/**
 * Whether any WebGL feature is needed on the current request.
 *
 * @return bool
 */
function orbe_needs_webgl() {
	$hero = is_front_page() && orbe_opt( 'hero_enable' ) && 'none' !== orbe_opt( 'hero_effect' );
	$nav  = 'webgl' === orbe_opt( 'nav_style' );
	$work = (bool) orbe_opt( 'work_webgl' );
	return (bool) apply_filters( 'orbe_needs_webgl', $hero || $nav || $work );
}

/**
 * Front-end configuration passed to the scripts.
 *
 * @return array<string, mixed>
 */
function orbe_script_config() {
	$config = array(
		'smoothScroll' => (bool) orbe_opt( 'smooth_scroll' ),
		'cursor'       => (bool) orbe_opt( 'custom_cursor' ),
		'preloader'    => (bool) orbe_opt( 'preloader' ),
		'transitions'  => (bool) orbe_opt( 'page_transitions' ),
		'hero'         => array(
			'effect'    => is_front_page() && orbe_opt( 'hero_enable' ) ? orbe_opt( 'hero_effect' ) : 'none',
			'colorA'    => orbe_opt( 'hero_color_a' ),
			'colorB'    => orbe_opt( 'hero_color_b' ),
			'intensity' => absint( orbe_opt( 'hero_intensity' ) ) / 100,
			'mouse'     => (bool) orbe_opt( 'hero_mouse' ),
		),
		'nav'          => array(
			'style'     => orbe_opt( 'nav_style' ),
			'effect'    => orbe_opt( 'nav_effect' ),
			'intensity' => absint( orbe_opt( 'nav_intensity' ) ) / 100,
		),
		'work'         => array(
			'webgl'     => (bool) orbe_opt( 'work_webgl' ),
			'intensity' => absint( orbe_opt( 'work_intensity' ) ) / 100,
		),
		'i18n'         => array(
			'menu'  => __( 'Menu', 'orbe' ),
			'close' => __( 'Close', 'orbe' ),
			'view'  => __( 'View', 'orbe' ),
		),
	);

	/**
	 * Filter the front-end configuration (window.orbeConfig).
	 *
	 * @param array $config Configuration.
	 */
	return apply_filters( 'orbe_script_config', $config );
}

/**
 * Enqueue front-end assets.
 */
function orbe_enqueue_assets() {
	wp_enqueue_style( 'orbe-fonts', ORBE_URI . '/assets/css/fonts.css', array(), orbe_asset_version( 'assets/css/fonts.css' ) );
	wp_enqueue_style( 'orbe-main', ORBE_URI . '/assets/css/main.css', array( 'orbe-fonts' ), orbe_asset_version( 'assets/css/main.css' ) );
	wp_add_inline_style( 'orbe-main', orbe_inline_css() );

	wp_enqueue_script( 'orbe-main', ORBE_URI . '/assets/js/main.js', array(), orbe_asset_version( 'assets/js/main.js' ), array( 'in_footer' => true ) );
	wp_add_inline_script( 'orbe-main', 'window.orbeConfig = ' . wp_json_encode( orbe_script_config() ) . ';', 'before' );

	if ( orbe_needs_webgl() ) {
		wp_enqueue_script( 'orbe-webgl', ORBE_URI . '/assets/js/webgl.js', array( 'orbe-main' ), orbe_asset_version( 'assets/js/webgl.js' ), array( 'in_footer' => true ) );
	}

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'orbe_enqueue_assets' );

/**
 * Preload the two main font files.
 */
function orbe_preload_fonts() {
	$fonts = array( 'CormorantGaramond-Light.woff2', 'EBGaramond-Roman.woff2' );
	if ( 'grotesk' === orbe_opt( 'font_pair' ) ) {
		return;
	}
	foreach ( $fonts as $font ) {
		printf(
			'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n",
			esc_url( ORBE_URI . '/assets/fonts/' . $font )
		);
	}
}
add_action( 'wp_head', 'orbe_preload_fonts', 1 );

/**
 * Sanitize a hex color, falling back to a default.
 *
 * @param string $value    Color.
 * @param string $fallback Fallback color.
 * @return string
 */
function orbe_hex( $value, $fallback ) {
	$hex = sanitize_hex_color( $value );
	return $hex ? $hex : $fallback;
}

/**
 * CSS custom properties generated from the color options.
 *
 * @return string
 */
function orbe_inline_css() {
	$defaults = orbe_option_defaults();
	$bg       = orbe_hex( orbe_opt( 'color_bg' ), $defaults['color_bg'] );
	$fg       = orbe_hex( orbe_opt( 'color_fg' ), $defaults['color_fg'] );
	$accent   = orbe_hex( orbe_opt( 'color_accent' ), $defaults['color_accent'] );

	// The dark scheme swaps background and text colors.
	if ( 'dark' === orbe_opt( 'color_scheme' ) ) {
		list( $bg, $fg ) = array( $fg, $bg );
	}

	return sprintf( ':root{--bg:%1$s;--fg:%2$s;--accent:%3$s;}', $bg, $fg, $accent );
}

/**
 * Block editor: same fonts and colors as the front end.
 */
function orbe_editor_assets() {
	wp_add_inline_style( 'wp-block-library', orbe_inline_css() );
}
add_action( 'enqueue_block_editor_assets', 'orbe_editor_assets' );
