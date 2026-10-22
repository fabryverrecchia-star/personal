<?php
/**
 * Menu item images for the WebGL navigation.
 *
 * Each primary menu link gets a data-nav-image attribute: the image chosen on
 * the menu item (Appearance → Menus) or, by default, the featured image of the
 * linked post, page or project.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Image field on each menu item.
 *
 * @param int $item_id Menu item ID.
 */
function orbe_menu_item_image_field( $item_id ) {
	$value = get_post_meta( $item_id, '_orbe_menu_image', true );
	wp_nonce_field( 'orbe_menu_image', 'orbe_menu_image_nonce' );
	?>
	<p class="field-orbe-image description description-wide">
		<label for="edit-menu-item-orbe-image-<?php echo esc_attr( $item_id ); ?>">
			<?php esc_html_e( 'WebGL menu image URL (optional)', 'orbe' ); ?><br>
			<input type="url" class="widefat" id="edit-menu-item-orbe-image-<?php echo esc_attr( $item_id ); ?>" name="orbe_menu_image[<?php echo esc_attr( $item_id ); ?>]" value="<?php echo esc_url( $value ); ?>" placeholder="https://">
		</label>
		<span class="description"><?php esc_html_e( 'Defaults to the featured image of the linked content.', 'orbe' ); ?></span>
	</p>
	<?php
}
add_action( 'wp_nav_menu_item_custom_fields', 'orbe_menu_item_image_field' );

/**
 * Save the menu item image.
 *
 * @param int $menu_id         Menu ID.
 * @param int $menu_item_db_id Menu item ID.
 */
function orbe_save_menu_item_image( $menu_id, $menu_item_db_id ) {
	if ( ! isset( $_POST['orbe_menu_image_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['orbe_menu_image_nonce'] ) ), 'orbe_menu_image' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_theme_options' ) ) {
		return;
	}
	$images = isset( $_POST['orbe_menu_image'] ) && is_array( $_POST['orbe_menu_image'] ) ? wp_unslash( $_POST['orbe_menu_image'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized per item below.
	$url    = isset( $images[ $menu_item_db_id ] ) ? esc_url_raw( $images[ $menu_item_db_id ] ) : '';
	if ( $url ) {
		update_post_meta( $menu_item_db_id, '_orbe_menu_image', $url );
	} else {
		delete_post_meta( $menu_item_db_id, '_orbe_menu_image' );
	}
}
add_action( 'wp_update_nav_menu_item', 'orbe_save_menu_item_image', 10, 2 );

/**
 * Image URL for a menu item.
 *
 * @param WP_Post $item Menu item.
 * @return string
 */
function orbe_menu_item_image( $item ) {
	$url = get_post_meta( $item->ID, '_orbe_menu_image', true );
	if ( ! $url && 'post_type' === $item->type && $item->object_id ) {
		$url = get_the_post_thumbnail_url( (int) $item->object_id, 'orbe-card' );
	}
	return $url ? (string) $url : '';
}

/**
 * Add the image and index to primary menu links.
 *
 * @param array    $atts Link attributes.
 * @param WP_Post  $item Menu item.
 * @param stdClass $args Menu arguments.
 * @return array
 */
function orbe_menu_link_attributes( $atts, $item, $args ) {
	if ( isset( $args->theme_location ) && 'primary' === $args->theme_location ) {
		$atts['class'] = trim( ( isset( $atts['class'] ) ? $atts['class'] : '' ) . ' nav__link' );
		$image         = orbe_menu_item_image( $item );
		if ( $image ) {
			$atts['data-nav-image'] = esc_url( $image );
		}
	}
	return $atts;
}
add_filter( 'nav_menu_link_attributes', 'orbe_menu_link_attributes', 10, 3 );

/**
 * Wrap primary menu titles for the line reveal animation.
 *
 * @param string   $title Item title.
 * @param WP_Post  $item  Menu item.
 * @param stdClass $args  Menu arguments.
 * @param int      $depth Depth.
 * @return string
 */
function orbe_menu_item_title( $title, $item, $args, $depth ) {
	if ( isset( $args->theme_location ) && 'primary' === $args->theme_location && 0 === $depth ) {
		$title = '<span class="nav__mask"><span class="nav__text">' . $title . '</span></span>';
	}
	return $title;
}
add_filter( 'nav_menu_item_title', 'orbe_menu_item_title', 10, 4 );

/**
 * Fallback when no primary menu is assigned: list the top-level pages.
 *
 * @param array $args Menu arguments.
 */
function orbe_menu_fallback( $args ) {
	$pages = get_pages(
		array(
			'parent'      => 0,
			'sort_column' => 'menu_order,post_title',
			'number'      => 6,
		)
	);
	echo '<ul class="' . esc_attr( $args['menu_class'] ) . '">';
	echo '<li class="menu-item"><a class="nav__link" href="' . esc_url( home_url( '/' ) ) . '"><span class="nav__mask"><span class="nav__text">' . esc_html__( 'Home', 'orbe' ) . '</span></span></a></li>';
	if ( orbe_has_projects() ) {
		echo '<li class="menu-item"><a class="nav__link" href="' . esc_url( (string) get_post_type_archive_link( 'orbe_project' ) ) . '"><span class="nav__mask"><span class="nav__text">' . esc_html__( 'Work', 'orbe' ) . '</span></span></a></li>';
	}
	foreach ( $pages as $page ) {
		$image = get_the_post_thumbnail_url( $page, 'orbe-card' );
		printf(
			'<li class="menu-item"><a class="nav__link" href="%1$s"%2$s><span class="nav__mask"><span class="nav__text">%3$s</span></span></a></li>',
			esc_url( get_permalink( $page ) ),
			$image ? ' data-nav-image="' . esc_url( $image ) . '"' : '',
			esc_html( get_the_title( $page ) )
		);
	}
	echo '</ul>';
}
