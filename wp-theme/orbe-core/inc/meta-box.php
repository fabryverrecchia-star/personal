<?php
/**
 * "Project details" meta box (works in both the block and classic editors).
 *
 * @package OrbeCore
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the meta box.
 */
function orbe_core_add_meta_box() {
	add_meta_box( 'orbe-project-details', __( 'Project details', 'orbe-core' ), 'orbe_core_render_meta_box', 'orbe_project', 'side' );
}
add_action( 'add_meta_boxes', 'orbe_core_add_meta_box' );

/**
 * Render the meta box.
 *
 * @param WP_Post $post Post.
 */
function orbe_core_render_meta_box( $post ) {
	wp_nonce_field( 'orbe_core_save', 'orbe_core_nonce' );
	foreach ( orbe_core_fields() as $key => $field ) {
		list( $label, $type ) = $field;
		$id                   = 'orbe-core-' . $key;
		$value                = get_post_meta( $post->ID, '_orbe_' . $key, true );
		$input                = 'color' === $type ? 'text' : $type;
		printf(
			'<p><label for="%1$s"><strong>%2$s</strong></label><br><input type="%3$s" class="widefat%4$s" id="%1$s" name="orbe_core[%5$s]" value="%6$s"></p>',
			esc_attr( $id ),
			esc_html( $label ),
			esc_attr( $input ),
			'color' === $type ? ' orbe-core-color' : '',
			esc_attr( $key ),
			esc_attr( $value )
		);
	}
	echo '<p class="description">' . esc_html__( 'The featured image is used for the project grid, the WebGL effects and the menu.', 'orbe-core' ) . '</p>';
}

/**
 * Color picker on the project screen.
 *
 * @param string $hook Admin page.
 */
function orbe_core_admin_assets( $hook ) {
	$screen = get_current_screen();
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) || ! $screen || 'orbe_project' !== $screen->post_type ) {
		return;
	}
	wp_enqueue_style( 'wp-color-picker' );
	wp_enqueue_script( 'wp-color-picker' );
	wp_add_inline_script( 'wp-color-picker', 'jQuery(function($){$(".orbe-core-color").wpColorPicker();});' );
}
add_action( 'admin_enqueue_scripts', 'orbe_core_admin_assets' );

/**
 * Save the fields.
 *
 * @param int $post_id Post ID.
 */
function orbe_core_save_meta_box( $post_id ) {
	if ( ! isset( $_POST['orbe_core_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['orbe_core_nonce'] ) ), 'orbe_core_save' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	$values = isset( $_POST['orbe_core'] ) && is_array( $_POST['orbe_core'] ) ? wp_unslash( $_POST['orbe_core'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized per field below.
	foreach ( orbe_core_fields() as $key => $field ) {
		$sanitize = 'orbe_core_sanitize_' . $field[1];
		$value    = isset( $values[ $key ] ) ? $sanitize( (string) $values[ $key ] ) : '';
		if ( '' === $value ) {
			delete_post_meta( $post_id, '_orbe_' . $key );
		} else {
			update_post_meta( $post_id, '_orbe_' . $key, $value );
		}
	}
}
add_action( 'save_post_orbe_project', 'orbe_core_save_meta_box' );
