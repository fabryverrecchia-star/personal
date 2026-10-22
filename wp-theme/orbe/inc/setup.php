<?php
/**
 * Theme setup: supports, menus, widgets, image sizes.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register theme supports and menus.
 */
function orbe_setup() {
	load_theme_textdomain( 'orbe', ORBE_DIR . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'editor-styles' );
	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 80,
			'width'       => 240,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);
	add_theme_support( 'customize-selective-refresh-widgets' );

	add_editor_style( array( 'assets/css/fonts.css', 'assets/css/editor.css' ) );

	register_nav_menus(
		array(
			'primary' => esc_html__( 'Primary navigation', 'orbe' ),
			'footer'  => esc_html__( 'Footer navigation', 'orbe' ),
		)
	);

	// Project cards and the WebGL textures (kept under 2048px for GPU limits).
	add_image_size( 'orbe-card', 1200, 1500, false );
	add_image_size( 'orbe-hero', 2048, 1365, false );
}
add_action( 'after_setup_theme', 'orbe_setup' );

/**
 * Content width for embeds.
 */
function orbe_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'orbe_content_width', 760 );
}
add_action( 'after_setup_theme', 'orbe_content_width', 0 );

/**
 * Widget areas.
 */
function orbe_widgets_init() {
	register_sidebar(
		array(
			'name'          => esc_html__( 'Footer', 'orbe' ),
			'id'            => 'footer-1',
			'description'   => esc_html__( 'Widgets displayed in the footer, next to the contact block.', 'orbe' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget__title label">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'orbe_widgets_init' );

/**
 * Body classes reflecting the active options.
 *
 * @param string[] $classes Body classes.
 * @return string[]
 */
function orbe_body_classes( $classes ) {
	$classes[] = 'orbe-scheme-' . sanitize_html_class( orbe_opt( 'color_scheme' ) );
	$classes[] = 'orbe-fonts-' . sanitize_html_class( orbe_opt( 'font_pair' ) );
	$classes[] = 'orbe-nav-' . sanitize_html_class( orbe_opt( 'nav_style' ) );
	if ( orbe_opt( 'custom_cursor' ) ) {
		$classes[] = 'orbe-has-cursor';
	}
	if ( ! is_singular() ) {
		$classes[] = 'hfeed';
	}
	return $classes;
}
add_filter( 'body_class', 'orbe_body_classes' );

/**
 * Pingback header on singular content.
 */
function orbe_pingback_header() {
	if ( is_singular() && pings_open() ) {
		printf( '<link rel="pingback" href="%s">', esc_url( get_bloginfo( 'pingback_url' ) ) );
	}
}
add_action( 'wp_head', 'orbe_pingback_header' );

/**
 * Shorter, cleaner excerpt "more" string.
 *
 * @return string
 */
function orbe_excerpt_more() {
	return '&hellip;';
}
add_filter( 'excerpt_more', 'orbe_excerpt_more' );
