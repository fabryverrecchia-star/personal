<?php
/**
 * Template helpers.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

/**
 * Site brand: custom logo or site name.
 */
function orbe_brand() {
	echo '<a class="site-brand" href="' . esc_url( home_url( '/' ) ) . '" rel="home">';
	if ( has_custom_logo() ) {
		$logo_id = get_theme_mod( 'custom_logo' );
		echo wp_get_attachment_image(
			$logo_id,
			'full',
			false,
			array(
				'class' => 'site-brand__logo',
				'alt'   => get_bloginfo( 'name' ),
			)
		);
	} else {
		echo '<span class="site-brand__name">' . esc_html( get_bloginfo( 'name' ) ) . '</span>';
	}
	echo '</a>';
}

/**
 * Project meta stored by the Orbe Core plugin (empty strings without it).
 *
 * @param int|null $post_id Post ID.
 * @return array{client: string, year: string, role: string, url: string, color: string}
 */
function orbe_project_meta( $post_id = null ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	$meta    = array();
	foreach ( array( 'client', 'year', 'role', 'url', 'color' ) as $key ) {
		$meta[ $key ] = (string) get_post_meta( $post_id, '_orbe_' . $key, true );
	}
	if ( '' === $meta['year'] ) {
		$meta['year'] = get_the_date( 'Y', $post_id );
	}
	return $meta;
}

/**
 * Comma-separated project categories (or post categories as a fallback).
 *
 * @param int|null $post_id Post ID.
 * @return string
 */
function orbe_project_terms( $post_id = null ) {
	$post_id  = $post_id ? $post_id : get_the_ID();
	$taxonomy = 'orbe_project' === get_post_type( $post_id ) ? 'orbe_project_type' : 'category';
	$terms    = get_the_terms( $post_id, $taxonomy );
	if ( ! $terms || is_wp_error( $terms ) ) {
		return '';
	}
	return implode( ', ', wp_list_pluck( $terms, 'name' ) );
}

/**
 * Media element synced with WebGL.
 *
 * The <img> is always rendered (SEO, no-JS, reduced motion); the WebGL layer
 * reads it through the data-gl attributes and hides it once its texture is ready.
 *
 * @param int    $post_id Post ID.
 * @param string $size    Image size.
 * @param array  $args    { eager: bool, class: string, hover: bool }.
 */
function orbe_media( $post_id, $size = 'orbe-card', $args = array() ) {
	$args  = wp_parse_args(
		$args,
		array(
			'eager' => false,
			'class' => '',
			'hover' => true,
		)
	);
	$meta  = orbe_project_meta( $post_id );
	$color = sanitize_hex_color( $meta['color'] );
	$color = $color ? $color : '#8a8378';

	printf(
		'<div class="media %1$s" data-gl data-gl-id="%2$d" data-gl-color="%3$s" data-gl-title="%4$s"%5$s>',
		esc_attr( $args['class'] ),
		absint( $post_id ),
		esc_attr( $color ),
		esc_attr( get_the_title( $post_id ) ),
		$args['hover'] ? '' : ' data-gl-hover="off"'
	);

	if ( has_post_thumbnail( $post_id ) ) {
		echo get_the_post_thumbnail(
			$post_id,
			$size,
			array(
				'class'    => 'media__img',
				'loading'  => $args['eager'] ? 'eager' : 'lazy',
				'decoding' => 'async',
				'alt'      => '',
			)
		);
	} else {
		printf(
			'<span class="media__placeholder" style="background-color:%1$s"><span>%2$s</span></span>',
			esc_attr( $color ),
			esc_html( get_the_title( $post_id ) )
		);
	}
	echo '</div>';
}

/**
 * Query for the projects grid: projects if the plugin is active, posts otherwise.
 *
 * @param int $count Number of items.
 * @return WP_Query
 */
function orbe_work_query( $count ) {
	$args = array(
		'post_type'           => orbe_has_projects() ? 'orbe_project' : 'post',
		'posts_per_page'      => $count,
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
		'orderby'             => array(
			'menu_order' => 'ASC',
			'date'       => 'DESC',
		),
	);
	return new WP_Query( apply_filters( 'orbe_work_query_args', $args ) );
}

/**
 * Inline layout variables of the scattered grid (12 columns, repeats after 16).
 *
 * @param int $index Item index.
 * @return string
 */
function orbe_scatter_style( $index ) {
	$layout = array(
		array( 2, 4, '4 / 5', 0, 0 ),
		array( 7, 3, '1 / 1', 9, 0 ),
		array( 11, 2, '3 / 4', -2, 0 ),
		array( 1, 3, '3 / 4', -7, 0 ),
		array( 5, 4, '4 / 3', 3, -2 ),
		array( 10, 3, '4 / 5', -9, 0 ),
		array( 3, 4, '16 / 10', -4, 0 ),
		array( 7, 2, '3 / 4', 7, -1.5 ),
		array( 9, 3, '1 / 1', -3, 0 ),
		array( 1, 3, '1 / 1', -6, 0 ),
		array( 4, 3, '4 / 5', 4, -1 ),
		array( 8, 5, '16 / 10', -8, -2 ),
		array( 2, 4, '4 / 3', -3, 0 ),
		array( 6, 2, '3 / 4', 6, -2 ),
		array( 8, 3, '4 / 5', -5, 0 ),
		array( 11, 2, '1 / 1', 4, -1 ),
	);
	$l      = $layout[ $index % count( $layout ) ];
	return sprintf( '--c:%d;--s:%d;--ar:%s;--y:%svw;--x:%svw;', $l[0], $l[1], $l[2], $l[3], $l[4] );
}

/**
 * Entry meta for blog posts.
 */
function orbe_posted_on() {
	printf(
		'<time class="entry__date" datetime="%1$s">%2$s</time>',
		esc_attr( get_the_date( DATE_W3C ) ),
		esc_html( get_the_date() )
	);
	$categories = get_the_category_list( esc_html__( ', ', 'orbe' ) );
	if ( $categories ) {
		echo ' <span class="entry__cats">' . wp_kses_post( $categories ) . '</span>';
	}
}

/**
 * Footer copyright line.
 *
 * @return string
 */
function orbe_copyright() {
	$text = orbe_opt( 'footer_copyright' );
	if ( '' === trim( (string) $text ) ) {
		/* translators: 1: year, 2: site name. */
		$text = sprintf( __( '© %1$s %2$s', 'orbe' ), wp_date( 'Y' ), get_bloginfo( 'name' ) );
	}
	return $text;
}

/**
 * Two-digit index ("01", "02"…).
 *
 * @param int $n Number.
 * @return string
 */
function orbe_index( $n ) {
	return str_pad( (string) $n, 2, '0', STR_PAD_LEFT );
}
