<?php
/**
 * Required and recommended plugins (TGM Plugin Activation).
 *
 * Orbe Core holds everything that belongs in "plugin territory": the Project
 * post type, its categories and fields. The theme still works without it and
 * falls back to blog posts for the projects grid.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

require_once ORBE_DIR . '/inc/tgmpa/class-tgm-plugin-activation.php';

/**
 * Register the plugins.
 */
function orbe_register_plugins() {
	$plugins = array(
		array(
			'name'     => 'Orbe Core',
			'slug'     => 'orbe-core',
			'source'   => ORBE_DIR . '/plugins/orbe-core.zip',
			'version'  => '1.0.0',
			'required' => false,
		),
		array(
			'name'     => 'Contact Form 7',
			'slug'     => 'contact-form-7',
			'required' => false,
		),
		array(
			'name'     => 'One Click Demo Import',
			'slug'     => 'one-click-demo-import',
			'required' => false,
		),
	);

	tgmpa(
		$plugins,
		array(
			'id'           => 'orbe',
			'menu'         => 'orbe-install-plugins',
			'parent_slug'  => 'themes.php',
			'capability'   => 'edit_theme_options',
			'has_notices'  => true,
			'dismissable'  => true,
			'is_automatic' => true,
		)
	);
}
add_action( 'tgmpa_register', 'orbe_register_plugins' );
