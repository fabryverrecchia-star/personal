<?php
/**
 * Plugin Name:       Orbe Core
 * Plugin URI:        https://example.com/orbe
 * Description:       Projects post type, project categories and project fields for the Orbe theme. Your projects stay safe if you switch themes.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            Orbe Studio
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       orbe-core
 * Domain Path:       /languages
 *
 * @package OrbeCore
 */

defined( 'ABSPATH' ) || exit;

define( 'ORBE_CORE_VERSION', '1.0.0' );
define( 'ORBE_CORE_FILE', __FILE__ );

/**
 * Project fields: key => [ label, type ].
 *
 * @return array<string, array{0: string, 1: string}>
 */
function orbe_core_fields() {
	return array(
		'client' => array( __( 'Client', 'orbe-core' ), 'text' ),
		'year'   => array( __( 'Year', 'orbe-core' ), 'text' ),
		'role'   => array( __( 'Role / services', 'orbe-core' ), 'text' ),
		'url'    => array( __( 'Live website URL', 'orbe-core' ), 'url' ),
		'color'  => array( __( 'Placeholder / accent color', 'orbe-core' ), 'color' ),
	);
}

/**
 * Load translations.
 */
function orbe_core_load_textdomain() {
	load_plugin_textdomain( 'orbe-core', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}
add_action( 'init', 'orbe_core_load_textdomain', 0 );

/**
 * Register the post type, taxonomy and meta.
 */
function orbe_core_register() {
	register_post_type(
		'orbe_project',
		array(
			'labels'        => array(
				'name'               => __( 'Projects', 'orbe-core' ),
				'singular_name'      => __( 'Project', 'orbe-core' ),
				'add_new_item'       => __( 'Add New Project', 'orbe-core' ),
				'edit_item'          => __( 'Edit Project', 'orbe-core' ),
				'new_item'           => __( 'New Project', 'orbe-core' ),
				'view_item'          => __( 'View Project', 'orbe-core' ),
				'search_items'       => __( 'Search Projects', 'orbe-core' ),
				'not_found'          => __( 'No projects found.', 'orbe-core' ),
				'not_found_in_trash' => __( 'No projects found in Trash.', 'orbe-core' ),
				'all_items'          => __( 'All Projects', 'orbe-core' ),
				'menu_name'          => __( 'Projects', 'orbe-core' ),
			),
			'public'        => true,
			'has_archive'   => true,
			'show_in_rest'  => true,
			'menu_icon'     => 'dashicons-portfolio',
			'menu_position' => 5,
			'rewrite'       => array( 'slug' => apply_filters( 'orbe_core_project_slug', 'work' ) ),
			'supports'      => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes', 'revisions', 'custom-fields' ),
		)
	);

	register_taxonomy(
		'orbe_project_type',
		'orbe_project',
		array(
			'labels'            => array(
				'name'          => __( 'Project Categories', 'orbe-core' ),
				'singular_name' => __( 'Project Category', 'orbe-core' ),
				'add_new_item'  => __( 'Add New Category', 'orbe-core' ),
				'edit_item'     => __( 'Edit Category', 'orbe-core' ),
				'all_items'     => __( 'All Categories', 'orbe-core' ),
				'menu_name'     => __( 'Categories', 'orbe-core' ),
			),
			'hierarchical'      => true,
			'show_in_rest'      => true,
			'show_admin_column' => true,
			'rewrite'           => array( 'slug' => apply_filters( 'orbe_core_project_type_slug', 'work-type' ) ),
		)
	);

	foreach ( orbe_core_fields() as $key => $field ) {
		register_post_meta(
			'orbe_project',
			'_orbe_' . $key,
			array(
				'type'              => 'string',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => 'orbe_core_sanitize_' . $field[1],
				'auth_callback'     => static function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}
}
add_action( 'init', 'orbe_core_register' );

/**
 * Sanitizers.
 *
 * @param string $value Value.
 * @return string
 */
function orbe_core_sanitize_text( $value ) {
	return sanitize_text_field( $value );
}

/**
 * URL sanitizer.
 *
 * @param string $value Value.
 * @return string
 */
function orbe_core_sanitize_url( $value ) {
	return esc_url_raw( $value );
}

/**
 * Color sanitizer.
 *
 * @param string $value Value.
 * @return string
 */
function orbe_core_sanitize_color( $value ) {
	$color = sanitize_hex_color( $value );
	return $color ? $color : '';
}

/**
 * Flush rewrite rules on activation so /work/ works immediately.
 */
function orbe_core_activate() {
	orbe_core_register();
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'orbe_core_activate' );

/**
 * Flush rewrite rules on deactivation.
 */
function orbe_core_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'orbe_core_deactivate' );

require __DIR__ . '/inc/meta-box.php';
