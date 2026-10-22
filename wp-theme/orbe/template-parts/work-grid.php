<?php
/**
 * Projects grid / list.
 *
 * Expects $args['query'] (WP_Query) and optionally $args['title'] and $args['heading'] ('h1' or 'h2').
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

$orbe_query   = isset( $args['query'] ) ? $args['query'] : $GLOBALS['wp_query'];
$orbe_title   = isset( $args['title'] ) ? $args['title'] : orbe_opt( 'work_title' );
$orbe_heading = isset( $args['heading'] ) && 'h1' === $args['heading'] ? 'h1' : 'h2';
$orbe_layout  = orbe_opt( 'work_layout' );

if ( ! $orbe_query->have_posts() ) {
	return;
}
?>
<section class="work container" data-work data-view="<?php echo esc_attr( $orbe_layout ); ?>" data-default-view="<?php echo esc_attr( $orbe_layout ); ?>">
	<div class="work__bar">
		<<?php echo esc_html( $orbe_heading ); ?> class="label">
			<?php
			/* translators: 1: section title, 2: number of items. */
			printf( esc_html__( '%1$s (%2$d)', 'orbe' ), esc_html( $orbe_title ), absint( $orbe_query->post_count ) );
			?>
		</<?php echo esc_html( $orbe_heading ); ?>>
		<?php if ( orbe_opt( 'work_toggle' ) ) : ?>
			<div class="work__toggle" role="group" aria-label="<?php esc_attr_e( 'Layout', 'orbe' ); ?>">
				<button type="button" class="link" data-view-btn="<?php echo 'list' === $orbe_layout ? 'scattered' : esc_attr( $orbe_layout ); ?>" aria-pressed="<?php echo 'list' === $orbe_layout ? 'false' : 'true'; ?>"><?php esc_html_e( 'Grid', 'orbe' ); ?></button>
				<button type="button" class="link" data-view-btn="list" aria-pressed="<?php echo 'list' === $orbe_layout ? 'true' : 'false'; ?>"><?php esc_html_e( 'List', 'orbe' ); ?></button>
			</div>
		<?php endif; ?>
	</div>

	<ul class="work__items">
		<?php
		$orbe_i = 0;
		while ( $orbe_query->have_posts() ) :
			$orbe_query->the_post();
			$orbe_meta = orbe_project_meta();
			?>
			<li class="item" style="<?php echo esc_attr( orbe_scatter_style( $orbe_i ) ); ?>">
				<a href="<?php the_permalink(); ?>" class="item__link" data-cursor="<?php esc_attr_e( 'View', 'orbe' ); ?>">
					<span class="item__index"><?php echo esc_html( orbe_index( $orbe_i + 1 ) ); ?></span>
					<div class="item__media" data-media>
						<?php orbe_media( get_the_ID(), 'orbe-card', array( 'eager' => $orbe_i < 3 ) ); ?>
					</div>
					<span class="item__title"><?php the_title(); ?></span>
					<span class="item__cat"><?php echo esc_html( orbe_project_terms() ); ?></span>
					<span class="item__year"><?php echo esc_html( $orbe_meta['year'] ); ?></span>
				</a>
			</li>
			<?php
			++$orbe_i;
		endwhile;
		?>
	</ul>
</section>
<?php
if ( isset( $args['query'] ) ) {
	wp_reset_postdata();
}
