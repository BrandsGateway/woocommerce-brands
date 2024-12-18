<?php
/**
 * Plugin Name: WooCommerce Brands
 * Plugin URI: https://woocommerce.com/products/brands/
 * Description: Add brands to your products, as well as widgets and shortcodes for displaying your brands.
 * Author: WooCommerce
 * Author URI: https://woocommerce.com/
 * Developer: WooCommerce
 * Developer URI: http://woocommerce.com/
 * Requires at least: 5.4
 * Tested up to: 6.7
 * Version: 1.7.7
 * Text Domain: woocommerce-brands
 * Domain Path: /languages/
 * Requires Plugins: woocommerce
 * WC tested up to: 9.4
 * WC requires at least: 6.0
 *
 * Copyright (c) 2020 WooCommerce
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * Woo: 18737:8a88c7cbd2f1e73636c331c7a86f818c
 *
 * @package woocommerce-brands
 */

require __DIR__ . '/vendor/autoload.php';

use Automattic\WooCommerce\Grow\Tools\CompatChecker\v0_0_1\Checker;
use Automattic\WooCommerce\Utilities\FeaturesUtil;
use Automattic\WooCommerce\Admin\BlockTemplates\BlockTemplateInterface;
use Automattic\WooCommerce\Admin\Features\ProductBlockEditor\ProductTemplates\ProductFormTemplateInterface;


// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Plugin init hook.
add_action( 'plugins_loaded', 'wc_brands_init', 1 );

// Automatic translations.
add_filter( 'woocommerce_translations_updates_for_woocommerce-brands', '__return_true' );

// HPOS and new product editor compatibility declaration.
add_action(
	'before_woocommerce_init',
	function () {
		if ( class_exists( FeaturesUtil::class ) ) {
			FeaturesUtil::declare_compatibility( 'custom_order_tables', plugin_basename( __FILE__ ) );
			FeaturesUtil::declare_compatibility( 'product_block_editor', plugin_basename( __FILE__ ) );
		}
	}
);

/**
 * Initialize plugin.
 */
function wc_brands_init() {
	define( 'WC_BRANDS_VERSION', '1.7.7' ); // WRCS: DEFINED_VERSION.

	// Run compatibility checker checks and bail if not compatible.
    //[PLUGIN CHANGE START]
	if ( class_exists('Checker') && ! Checker::instance()->is_compatible( __FILE__, WC_BRANDS_VERSION ) ) {
    //[PLUGIN CHANGE END]
		return;
	}

	/**
	 * Localisation
	 */
	load_plugin_textdomain( 'woocommerce-brands', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );

	/**
	 * WC_Brands classes
	 */
	require_once 'includes/class-wc-brands.php';

	if ( is_admin() ) {
		require_once 'includes/class-wc-brands-admin.php';
		add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'wc_brands_plugin_action_links' );
	}

	require_once 'includes/wc-brands-functions.php';
}

/**
 * Add custom action links on the plugin screen.
 *
 * @param  mixed $actions Plugin Actions Links.
 * @return array
 */
function wc_brands_plugin_action_links( $actions ) {
	$custom_actions = array();

	// Documentation URL.
	$custom_actions['docs'] = sprintf( '<a href="%s">%s</a>', 'https://woocommerce.com/document/woocommerce-brands/', __( 'Docs', 'woocommerce-brands' ) );

	// Support URL.
	$custom_actions['support'] = sprintf( '<a href="%s">%s</a>', 'https://woocommerce.com/contact-us/', __( 'Support', 'woocommerce-brands' ) );

	// Changelog link.
	$custom_actions['changelog'] = sprintf( '<a href="%s" target="_blank">%s</a>', 'https://woocommerce.com/changelogs/woocommerce-brands/changelog.txt', __( 'Changelog', 'woocommerce-brands' ) );

	// Add the links to the front of the actions list.
	return array_merge( $custom_actions, $actions );
}

/**
 * WooCommerce Deactivated Notice.
 */
function wc_brands_woocommerce_deactivated() {
	/* translators: %s: WooCommerce link */
	echo '<div class="error"><p>' . sprintf( esc_html__( 'WooCommerce Brands requires %s to be installed and active.', 'woocommerce-brands' ), '<a href="https://woocommerce.com/" target="_blank">WooCommerce</a>' ) . '</p></div>';
}

/**
 * Activation hooks.
 */
register_activation_hook( __FILE__, 'wc_brands_activate', 10 );
register_activation_hook( __FILE__, 'flush_rewrite_rules', 20 );

/**
 * Register taxonomy upon activation so we can flush rewrite rules and prevent a 404.
 */
function wc_brands_activate() {
	if ( class_exists( 'WooCommerce' ) ) {
		require_once 'includes/class-wc-brands.php';
		WC_Brands::init_taxonomy();
	}
}

if ( ! function_exists( 'wc_brands_on_block_template_register' ) ) {
	/**
	 * Add a new block to the template.
	 *
	 * @param string                 $template_id Template ID.
	 * @param string                 $template_area Template area.
	 * @param BlockTemplateInterface $template Template instance.
	 */
	function wc_brands_on_block_template_register( string $template_id, string $template_area, BlockTemplateInterface $template ) {
		if ( $template instanceof ProductFormTemplateInterface && 'simple-product' === $template->get_id() ) {
			$section = $template->get_section_by_id( 'product-catalog-section' );
			if ( $section !== null ) {
				$section->add_block(
					array(
						'id'         => 'woocommerce-brands-select',
						'blockName'  => 'woocommerce/product-taxonomy-field',
						'order'      => 15,
						'attributes' => array(
							'label'       => __( 'Brands', 'woocommerce-brands' ),
							'createTitle' => __( 'Create new brand', 'woocommerce-brands' ),
							'slug'        => 'product_brand',
							'property'    => 'brands',
						),
					)
				);
			}
		}
	}
	add_action( 'woocommerce_layout_template_after_instantiation', 'wc_brands_on_block_template_register', 10, 3 );
}
