<?php
/**
 * Orbe functions and definitions.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

define( 'ORBE_VERSION', '1.0.0' );
define( 'ORBE_DIR', get_template_directory() );
define( 'ORBE_URI', get_template_directory_uri() );

require ORBE_DIR . '/inc/options.php';
require ORBE_DIR . '/inc/setup.php';
require ORBE_DIR . '/inc/enqueue.php';
require ORBE_DIR . '/inc/customizer.php';
require ORBE_DIR . '/inc/template-tags.php';
require ORBE_DIR . '/inc/menu-images.php';
require ORBE_DIR . '/inc/plugins.php';
