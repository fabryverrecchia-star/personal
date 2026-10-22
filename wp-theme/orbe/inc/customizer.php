<?php
/**
 * Customizer: the "Orbe Options" panel.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Sanitize a checkbox.
 *
 * @param mixed $value Value.
 * @return bool
 */
function orbe_sanitize_checkbox( $value ) {
	return (bool) $value;
}

/**
 * Sanitize a select / radio against its declared choices.
 *
 * @param string               $value   Value.
 * @param WP_Customize_Setting $setting Setting.
 * @return string
 */
function orbe_sanitize_choice( $value, $setting ) {
	$key     = substr( $setting->id, strlen( 'orbe_' ) );
	$choices = orbe_option_choices();
	if ( isset( $choices[ $key ][ $value ] ) ) {
		return $value;
	}
	return $setting->default;
}

/**
 * Sanitize a 0–100 range value.
 *
 * @param mixed $value Value.
 * @return int
 */
function orbe_sanitize_percent( $value ) {
	return max( 0, min( 100, absint( $value ) ) );
}

/**
 * Sanitize the project count (1–48).
 *
 * @param mixed $value Value.
 * @return int
 */
function orbe_sanitize_count( $value ) {
	return max( 1, min( 48, absint( $value ) ) );
}

/**
 * Allow a minimal set of inline tags in headings (em, strong, br, span).
 *
 * @param string $value Value.
 * @return string
 */
function orbe_sanitize_inline_html( $value ) {
	return wp_kses(
		$value,
		array(
			'em'     => array(),
			'strong' => array(),
			'br'     => array(),
			'span'   => array( 'class' => true ),
		)
	);
}

/**
 * Register the Customizer panel, sections, settings and controls.
 *
 * @param WP_Customize_Manager $wp_customize Customizer manager.
 */
function orbe_customize_register( $wp_customize ) {
	$defaults = orbe_option_defaults();
	$choices  = orbe_option_choices();

	$wp_customize->add_panel(
		'orbe_options',
		array(
			'title'       => esc_html__( 'Orbe Options', 'orbe' ),
			'description' => esc_html__( 'WebGL effects, navigation, projects grid, motion and footer.', 'orbe' ),
			'priority'    => 30,
		)
	);

	$sections = array(
		'orbe_style'  => esc_html__( 'Colors & Typography', 'orbe' ),
		'orbe_hero'   => esc_html__( 'Hero (WebGL)', 'orbe' ),
		'orbe_nav'    => esc_html__( 'Navigation (WebGL)', 'orbe' ),
		'orbe_work'   => esc_html__( 'Projects Grid', 'orbe' ),
		'orbe_motion' => esc_html__( 'Motion & Interactions', 'orbe' ),
		'orbe_footer' => esc_html__( 'Footer', 'orbe' ),
	);
	$priority = 10;
	foreach ( $sections as $id => $title ) {
		$wp_customize->add_section(
			$id,
			array(
				'title'    => $title,
				'panel'    => 'orbe_options',
				'priority' => $priority,
			)
		);
		$priority += 10;
	}

	/*
	 * Each field: key => [ section, type, label, description? ].
	 * Types: color, checkbox, select, range, text, inline, textarea, email, count.
	 */
	$fields = array(
		'color_scheme'     => array( 'orbe_style', 'select', __( 'Color scheme', 'orbe' ), __( 'Dark swaps the background and text colors.', 'orbe' ) ),
		'color_bg'         => array( 'orbe_style', 'color', __( 'Background color', 'orbe' ) ),
		'color_fg'         => array( 'orbe_style', 'color', __( 'Text color', 'orbe' ) ),
		'color_accent'     => array( 'orbe_style', 'color', __( 'Accent color', 'orbe' ) ),
		'font_pair'        => array( 'orbe_style', 'select', __( 'Font pairing', 'orbe' ) ),

		'hero_enable'      => array( 'orbe_hero', 'checkbox', __( 'Show the hero on the front page', 'orbe' ) ),
		'hero_effect'      => array( 'orbe_hero', 'select', __( 'WebGL scene', 'orbe' ), __( 'Falls back to a static gradient when WebGL or motion is unavailable.', 'orbe' ) ),
		'hero_title'       => array( 'orbe_hero', 'inline', __( 'Title', 'orbe' ), __( 'Wrap words in em tags to highlight them in the accent color.', 'orbe' ) ),
		'hero_subtitle'    => array( 'orbe_hero', 'text', __( 'Subtitle', 'orbe' ) ),
		'hero_color_a'     => array( 'orbe_hero', 'color', __( 'Scene color A', 'orbe' ) ),
		'hero_color_b'     => array( 'orbe_hero', 'color', __( 'Scene color B', 'orbe' ) ),
		'hero_intensity'   => array( 'orbe_hero', 'range', __( 'Effect intensity', 'orbe' ) ),
		'hero_mouse'       => array( 'orbe_hero', 'checkbox', __( 'React to the mouse', 'orbe' ) ),

		'nav_style'        => array( 'orbe_nav', 'select', __( 'Menu style', 'orbe' ), __( 'The WebGL menu shows each item’s featured image — or the image set on the menu item — with a distortion effect.', 'orbe' ) ),
		'nav_effect'       => array( 'orbe_nav', 'select', __( 'Image distortion', 'orbe' ) ),
		'nav_intensity'    => array( 'orbe_nav', 'range', __( 'Distortion intensity', 'orbe' ) ),

		'work_title'       => array( 'orbe_work', 'text', __( 'Section title', 'orbe' ) ),
		'work_layout'      => array( 'orbe_work', 'select', __( 'Default layout', 'orbe' ) ),
		'work_count'       => array( 'orbe_work', 'count', __( 'Projects on the front page', 'orbe' ) ),
		'work_toggle'      => array( 'orbe_work', 'checkbox', __( 'Show the grid / list switch', 'orbe' ) ),
		'work_webgl'       => array( 'orbe_work', 'checkbox', __( 'WebGL images (scroll bend & hover tilt)', 'orbe' ) ),
		'work_intensity'   => array( 'orbe_work', 'range', __( 'WebGL intensity', 'orbe' ) ),

		'smooth_scroll'    => array( 'orbe_motion', 'checkbox', __( 'Smooth scrolling (Lenis)', 'orbe' ) ),
		'custom_cursor'    => array( 'orbe_motion', 'checkbox', __( 'Custom cursor', 'orbe' ) ),
		'preloader'        => array( 'orbe_motion', 'checkbox', __( 'Preloader on first visit', 'orbe' ) ),
		'page_transitions' => array( 'orbe_motion', 'checkbox', __( 'Page transitions', 'orbe' ), __( 'All motion is disabled for visitors who ask their system for reduced motion.', 'orbe' ) ),

		'footer_cta'       => array( 'orbe_footer', 'text', __( 'Call to action', 'orbe' ) ),
		'footer_email'     => array( 'orbe_footer', 'email', __( 'Contact email', 'orbe' ) ),
		'footer_socials'   => array( 'orbe_footer', 'textarea', __( 'Social links', 'orbe' ), __( 'One per line: Label|https://url', 'orbe' ) ),
		'footer_copyright' => array( 'orbe_footer', 'text', __( 'Copyright text', 'orbe' ), __( 'Leave empty for "© Year Site name".', 'orbe' ) ),
	);

	$sanitizers = array(
		'color'    => 'sanitize_hex_color',
		'checkbox' => 'orbe_sanitize_checkbox',
		'select'   => 'orbe_sanitize_choice',
		'range'    => 'orbe_sanitize_percent',
		'count'    => 'orbe_sanitize_count',
		'text'     => 'sanitize_text_field',
		'inline'   => 'orbe_sanitize_inline_html',
		'textarea' => 'sanitize_textarea_field',
		'email'    => 'sanitize_email',
	);

	foreach ( $fields as $key => $field ) {
		list( $section, $type, $label ) = $field;
		$id                             = 'orbe_' . $key;

		$wp_customize->add_setting(
			$id,
			array(
				'default'           => $defaults[ $key ],
				'sanitize_callback' => $sanitizers[ $type ],
				'transport'         => in_array( $key, array( 'hero_title', 'hero_subtitle', 'footer_cta' ), true ) ? 'postMessage' : 'refresh',
			)
		);

		$args = array(
			'section'     => $section,
			'label'       => $label,
			'description' => isset( $field[3] ) ? $field[3] : '',
		);

		if ( 'color' === $type ) {
			$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, $id, $args ) );
			continue;
		}

		switch ( $type ) {
			case 'select':
				$args['type']    = 'select';
				$args['choices'] = $choices[ $key ];
				break;
			case 'range':
				$args['type']        = 'range';
				$args['input_attrs'] = array(
					'min'  => 0,
					'max'  => 100,
					'step' => 1,
				);
				break;
			case 'count':
				$args['type']        = 'number';
				$args['input_attrs'] = array(
					'min' => 1,
					'max' => 48,
				);
				break;
			case 'inline':
				$args['type'] = 'textarea';
				break;
			default:
				$args['type'] = $type;
		}
		$wp_customize->add_control( $id, $args );
	}

	// Live preview of the texts.
	if ( isset( $wp_customize->selective_refresh ) ) {
		$partials = array(
			'orbe_hero_title'    => array( '.hero__title', 'orbe_hero_title_html' ),
			'orbe_hero_subtitle' => array( '.hero__subtitle', 'orbe_hero_subtitle_html' ),
			'orbe_footer_cta'    => array( '.footer__cta-text', 'orbe_footer_cta_html' ),
		);
		foreach ( $partials as $setting => $partial ) {
			$wp_customize->selective_refresh->add_partial(
				$setting,
				array(
					'selector'        => $partial[0],
					'render_callback' => $partial[1],
				)
			);
		}
	}

	$wp_customize->get_setting( 'blogname' )->transport = 'postMessage';
	if ( isset( $wp_customize->selective_refresh ) ) {
		$wp_customize->selective_refresh->add_partial(
			'blogname',
			array(
				'selector'        => '.site-brand__name',
				'render_callback' => 'orbe_blogname_html',
			)
		);
	}
}
add_action( 'customize_register', 'orbe_customize_register' );

/**
 * Selective refresh renderers.
 */
function orbe_hero_title_html() {
	return orbe_sanitize_inline_html( orbe_opt( 'hero_title' ) );
}

/**
 * Hero subtitle renderer.
 *
 * @return string
 */
function orbe_hero_subtitle_html() {
	return esc_html( orbe_opt( 'hero_subtitle' ) );
}

/**
 * Footer call to action renderer.
 *
 * @return string
 */
function orbe_footer_cta_html() {
	return esc_html( orbe_opt( 'footer_cta' ) );
}

/**
 * Site name renderer.
 *
 * @return string
 */
function orbe_blogname_html() {
	return esc_html( get_bloginfo( 'name' ) );
}
