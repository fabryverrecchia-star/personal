<?php
/**
 * Single project: fullscreen cover, facts, content, next project.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	$orbe_meta = orbe_project_meta();
	?>
	<article id="post-<?php the_ID(); ?>" <?php post_class( 'project' ); ?>>
		<header class="project__header container">
			<p class="label" data-reveal><?php echo esc_html( orbe_project_terms() ); ?></p>
			<?php the_title( '<h1 class="project__title display" data-reveal="lines">', '</h1>' ); ?>
			<dl class="project__facts" data-reveal>
				<?php
				$orbe_facts = array(
					__( 'Client', 'orbe' ) => $orbe_meta['client'],
					__( 'Year', 'orbe' )   => $orbe_meta['year'],
					__( 'Role', 'orbe' )   => $orbe_meta['role'],
				);
				foreach ( $orbe_facts as $orbe_label => $orbe_value ) :
					if ( '' === $orbe_value ) {
						continue;
					}
					?>
					<div><dt class="label"><?php echo esc_html( $orbe_label ); ?></dt><dd><?php echo esc_html( $orbe_value ); ?></dd></div>
				<?php endforeach; ?>
				<?php if ( $orbe_meta['url'] ) : ?>
					<div><dt class="label"><?php esc_html_e( 'Website', 'orbe' ); ?></dt><dd><a class="link" href="<?php echo esc_url( $orbe_meta['url'] ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Visit', 'orbe' ); ?></a></dd></div>
				<?php endif; ?>
			</dl>
		</header>

		<div class="project__hero">
			<?php
			orbe_media(
				get_the_ID(),
				'orbe-hero',
				array(
					'eager' => true,
					'hover' => false,
				)
			);
			?>
		</div>

		<div class="entry-content container">
			<?php
			the_content();
			wp_link_pages();
			?>
		</div>

		<?php
		$orbe_next = get_adjacent_post( false, '', false );
		if ( ! $orbe_next ) {
			$orbe_first = get_posts(
				array(
					'post_type'      => get_post_type(),
					'posts_per_page' => 1,
					'orderby'        => array(
						'menu_order' => 'ASC',
						'date'       => 'ASC',
					),
					'exclude'        => array( get_the_ID() ),
				)
			);
			$orbe_next  = $orbe_first ? $orbe_first[0] : null;
		}
		if ( $orbe_next ) :
			?>
			<a class="next-project container" href="<?php echo esc_url( get_permalink( $orbe_next ) ); ?>" data-cursor="<?php esc_attr_e( 'Next', 'orbe' ); ?>">
				<span class="label"><?php esc_html_e( 'Next project', 'orbe' ); ?></span>
				<span class="next-project__title display"><?php echo esc_html( get_the_title( $orbe_next ) ); ?></span>
				<div class="next-project__media"><?php orbe_media( $orbe_next->ID, 'orbe-card' ); ?></div>
			</a>
		<?php endif; ?>
	</article>
	<?php
endwhile;

get_footer();
