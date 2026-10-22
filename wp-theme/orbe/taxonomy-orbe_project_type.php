<?php
/**
 * Project category archive (same layout as the projects archive).
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

get_header();

$orbe_title = is_tax() ? single_term_title( '', false ) : post_type_archive_title( '', false );

get_template_part(
	'template-parts/page-header',
	null,
	array(
		'title' => $orbe_title,
		'intro' => get_the_archive_description(),
	)
);

$orbe_terms = get_terms(
	array(
		'taxonomy'   => 'orbe_project_type',
		'hide_empty' => true,
	)
);
if ( $orbe_terms && ! is_wp_error( $orbe_terms ) ) :
	?>
	<nav class="filters container" aria-label="<?php esc_attr_e( 'Project categories', 'orbe' ); ?>">
		<a class="link<?php echo is_post_type_archive( 'orbe_project' ) ? ' is-active' : ''; ?>" href="<?php echo esc_url( (string) get_post_type_archive_link( 'orbe_project' ) ); ?>"><?php esc_html_e( 'All', 'orbe' ); ?></a>
		<?php foreach ( $orbe_terms as $orbe_term ) : ?>
			<a class="link<?php echo is_tax( 'orbe_project_type', $orbe_term->term_id ) ? ' is-active' : ''; ?>" href="<?php echo esc_url( get_term_link( $orbe_term ) ); ?>"><?php echo esc_html( $orbe_term->name ); ?></a>
		<?php endforeach; ?>
	</nav>
	<?php
endif;

if ( have_posts() ) {
	get_template_part( 'template-parts/work-grid', null, array( 'title' => __( 'Projects', 'orbe' ) ) );
	the_posts_pagination( array( 'class' => 'pagination container' ) );
} else {
	echo '<div class="container">';
	get_template_part( 'template-parts/content', 'none' );
	echo '</div>';
}

get_footer();
