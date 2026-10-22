<?php
/**
 * Theme options: defaults, choices and accessors.
 *
 * Every option is a theme_mod prefixed with "orbe_". Defaults and choices are
 * declared once here and shared by the Customizer, the templates and the
 * front-end script configuration.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Option defaults.
 *
 * @return array<string, mixed>
 */
function orbe_option_defaults() {
	return array(
		// Colors & typography.
		'color_bg'         => '#efede8',
		'color_fg'         => '#121211',
		'color_accent'     => '#c8553d',
		'color_scheme'     => 'light',
		'font_pair'        => 'editorial',

		// Hero.
		'hero_enable'      => true,
		'hero_effect'      => 'blob',
		'hero_title'       => __( 'We craft <em>immersive</em> digital experiences.', 'orbe' ),
		'hero_subtitle'    => __( 'Independent creative studio — brand, web & motion.', 'orbe' ),
		'hero_color_a'     => '#c8553d',
		'hero_color_b'     => '#2b3a67',
		'hero_intensity'   => 50,
		'hero_mouse'       => true,

		// Navigation.
		'nav_style'        => 'webgl',
		'nav_effect'       => 'wave',
		'nav_intensity'    => 50,

		// Projects grid.
		'work_layout'      => 'scattered',
		'work_count'       => 12,
		'work_toggle'      => true,
		'work_webgl'       => true,
		'work_intensity'   => 50,
		'work_title'       => __( 'Selected work', 'orbe' ),

		// Motion.
		'smooth_scroll'    => true,
		'custom_cursor'    => true,
		'preloader'        => true,
		'page_transitions' => true,

		// Footer.
		'footer_cta'       => __( 'Have a project in mind?', 'orbe' ),
		'footer_email'     => 'hello@example.com',
		'footer_socials'   => "Instagram|https://instagram.com\nLinkedIn|https://linkedin.com\nBehance|https://behance.net",
		'footer_copyright' => '',
	);
}

/**
 * Choices for select / radio options.
 *
 * @return array<string, array<string, string>>
 */
function orbe_option_choices() {
	return array(
		'color_scheme' => array(
			'light' => __( 'Light', 'orbe' ),
			'dark'  => __( 'Dark', 'orbe' ),
		),
		'font_pair'    => array(
			'editorial' => __( 'Editorial — Cormorant & EB Garamond', 'orbe' ),
			'grotesk'   => __( 'Grotesk — Helvetica Neue / system sans', 'orbe' ),
			'mixed'     => __( 'Mixed — Cormorant titles, sans text', 'orbe' ),
		),
		'hero_effect'  => array(
			'blob'      => __( 'Liquid blob (Three.js)', 'orbe' ),
			'particles' => __( 'Particle sphere (Three.js)', 'orbe' ),
			'gradient'  => __( 'Flowing gradient (WebGL shader)', 'orbe' ),
			'none'      => __( 'None — text only', 'orbe' ),
		),
		'nav_style'    => array(
			'webgl'   => __( 'Fullscreen with WebGL image reveal', 'orbe' ),
			'overlay' => __( 'Fullscreen, no WebGL', 'orbe' ),
			'inline'  => __( 'Classic inline menu', 'orbe' ),
		),
		'nav_effect'   => array(
			'wave'   => __( 'Wave distortion', 'orbe' ),
			'rgb'    => __( 'RGB shift', 'orbe' ),
			'liquid' => __( 'Liquid noise', 'orbe' ),
		),
		'work_layout'  => array(
			'scattered' => __( 'Scattered editorial grid', 'orbe' ),
			'grid'      => __( 'Regular grid', 'orbe' ),
			'list'      => __( 'List', 'orbe' ),
		),
	);
}

/**
 * Read an option, falling back to its default.
 *
 * @param string $key Option key without the "orbe_" prefix.
 * @return mixed
 */
function orbe_opt( $key ) {
	$defaults = orbe_option_defaults();
	$default  = array_key_exists( $key, $defaults ) ? $defaults[ $key ] : null;
	$value    = get_theme_mod( 'orbe_' . $key, $default );

	/**
	 * Filter a theme option value.
	 *
	 * @param mixed  $value Option value.
	 * @param string $key   Option key.
	 */
	return apply_filters( 'orbe_option', $value, $key );
}

/**
 * Whether the companion plugin (projects post type) is active.
 *
 * @return bool
 */
function orbe_has_projects() {
	return post_type_exists( 'orbe_project' );
}

/**
 * Parse the "Label|URL" social links option.
 *
 * @return array<int, array{label: string, url: string}>
 */
function orbe_social_links() {
	$links = array();
	$lines = preg_split( '/\r\n|\r|\n/', (string) orbe_opt( 'footer_socials' ) );
	foreach ( $lines as $line ) {
		$parts = array_map( 'trim', explode( '|', $line, 2 ) );
		if ( 2 === count( $parts ) && '' !== $parts[0] && '' !== $parts[1] ) {
			$links[] = array(
				'label' => $parts[0],
				'url'   => $parts[1],
			);
		}
	}
	return $links;
}
