<?php
/**
 * Nothing found.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;
?>
<section class="no-results">
	<p class="lead"><?php esc_html_e( 'Nothing matched your request. Try another search.', 'orbe' ); ?></p>
	<?php get_search_form(); ?>
</section>
