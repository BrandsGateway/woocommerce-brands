import { test, expect } from "@playwright/test";

test("Smoke test", async ({ page }) => {
  const login = async (username, password) => {
    await page.goto("/wp-admin");

    // This line should not be needed, but when it is removed,
    // it causes an issue where the password is being put into the username field,
    // and the test fails.
    await page.getByLabel("Username or Email Address").click();

    await page.getByLabel("Username or Email Address").fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log In" }).click();
  };

  // Visit Settings > Permalinks page to fix the Shop page 404 error.
  // It seems like WooCommerce may not have been properly setup via WP CLI.
  // This is a temporary hack until we figure out how to fix it, possibly via WP CLI.
  const fixShopPage404Error = async () => {
    await page
      .locator("#menu-settings")
      .getByRole("link", { name: "Settings" })
      .click();
    await page.getByRole("link", { name: "Permalinks" }).click();
    expect(
      page.getByRole("heading", { name: "Permalink Settings" })
    ).toBeVisible();
  };

  /**
   * Go to the Brands page.
   *
   * This will visit the Products page first, and then click on the Brands link.
   * This is to workaround the hover menu for now.
   */
  const goToBrandsPage = async () => {
    await page
      .locator("#menu-posts-product")
      .getByRole("link", { name: "Products", exact: true })
      .click();
    await page.getByRole("link", { name: "Brands", exact: true }).click();

    // Wait for the Brands page to load.
    // This is needed so that checking for existing brands would work.
    await page.waitForLoadState("networkidle");
  };

  const createBrandIfNotExist = async (
    name,
    slug,
    parentBrand,
    description,
    thumbnailFileName
  ) => {
    // Create "WooCommerce" brand if it does not exist.
    const cellVisible = await page
      .locator("#posts-filter")
      .getByRole("cell", { name: slug, exact: true })
      .isVisible();

    if (cellVisible) {
      return;
    }

    await page.getByRole("textbox", { name: "Name" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(name);
    await page.getByRole("textbox", { name: "Slug" }).click();
    await page.getByRole("textbox", { name: "Slug" }).fill(slug);

    await page
      .getByRole("combobox", { name: "Parent Brand" })
      .selectOption({ label: parentBrand });

    await page.getByRole("textbox", { name: "Description" }).click();
    await page.getByRole("textbox", { name: "Description" }).fill(description);
    await page.getByRole("button", { name: "Upload/Add image" }).click();
    await page.getByRole("tab", { name: "Media Library" }).click();
    await page.getByRole("checkbox", { name: thumbnailFileName }).click();
    await page.getByRole("button", { name: "Use image" }).click();
    await page.getByRole("button", { name: "Add New Brand" }).click();

    // We should see an "Item added." notice message at the top of the page.
    await expect(
      page.locator("#ajax-response").getByText("Item added.")
    ).toBeVisible();

    // We should see the newly created brand in the Brands table.
    await expect(
      page
        .locator("#posts-filter")
        .getByRole("cell", { name: slug, exact: true })
    ).toHaveCount(1);
  };

  /**
   * Edit a brand.
   *
   * You must be in the Brands page before calling this function.
   * To do so, call `goToBrandsPage()` first.
   *
   * After a brand is edited, you will be redirected to the Brands page.
   */
  const editBrand = async (
    currentName,
    { name, slug, parentBrand, description, thumbnailFileName }
  ) => {
    await page.getByLabel(`“${currentName}” (Edit)`).click();
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Parent Brand").selectOption({ label: parentBrand });
    await page.getByLabel("Description").fill(description);

    await page.getByRole("button", { name: "Upload/Add image" }).click();
    await page.getByRole("tab", { name: "Media Library" }).click();
    await page.getByLabel(thumbnailFileName).click();
    await page.getByRole("button", { name: "Use image" }).click();

    await page.getByRole("button", { name: "Update" }).click();

    // We should see an "Item updated." notice message at the top of the page.
    await expect(
      page.locator("#message").getByText("Item updated.")
    ).toBeVisible();

    // navigate back to Brands page.
    await page.getByRole("link", { name: "← Go to Brands" }).click();

    // confirm that the brand has been updated.
    await expect(
      page
        .locator("#posts-filter")
        .getByRole("cell", { name: slug, exact: true })
    ).toHaveCount(1);
  };

  /**
   * Delete a brand.
   *
   * You must be in the Brands page before calling this function.
   * To do so, call `goToBrandsPage()` first.
   *
   * After a brand is deleted, you will be redirected to the Brands page.
   */
  const deleteBrand = async (name) => {
    await page.getByLabel(`“${name}” (Edit)`).click();

    // After clicking the "Delete" button, there will be a confirmation dialog.
    page.once("dialog", (dialog) => {
      // Click "OK" to confirm the deletion.
      dialog.accept();
    });

    // Click on the "Delete" button.
    await page.getByRole("link", { name: "Delete" }).click();

    // We should now be in the Brands page.
    // Confirm that the brand has been deleted and is no longer in the Brands table.
    await expect(
      page
        .locator("#posts-filter")
        .getByRole("cell", { name: name, exact: true })
    ).toHaveCount(0);
  };

  /**
   * Go to the Coupons page.
   *
   * You must be logged in first in the wp-admin dashboard before calling this function.
   * To do so, call `login()` first.
   *
   * This will visit the Marketing page first, and then click on the Coupons submenu item.
   * This is to workaround the hover menu for now.
   */
  const goToCouponsPage = async () => {
    await page.getByRole("link", { name: "Marketing" }).click();
    await page
      .locator("#toplevel_page_woocommerce-marketing")
      .getByRole("link", { name: "Coupons" })
      .click();

    // assert that we are now in the Coupons page.
    await expect(
      page
        .locator("#wpbody-content")
        .getByRole("heading", { name: "Coupons", exact: true })
    ).toBeVisible();
  };

  /**
   * Add a new coupon.
   *
   * You must be in the Coupons page before calling this function.
   * To do so, call `goToCouponsPage()` first.
   *
   * After adding the coupon, you will be redirected to the Coupons page.
   */
  const addCoupon = async ({
    code,
    description,
    general: { discountType, couponAmount },
    usageRestriction: { productBrands, excludeBrands },
  }) => {
    await page.getByRole("link", { name: "Add coupon" }).click();

    await page.getByLabel("Coupon code").fill(code);
    await page.getByPlaceholder("Description (optional)").fill(description);

    await page.getByLabel("Discount type").selectOption(discountType);
    await page.getByLabel("Coupon amount").fill(couponAmount);

    await page.getByRole("link", { name: "Usage restriction" }).click();

    for (const brand of productBrands) {
      await page
        .locator("select#product_brands + span.select2")
        .getByRole("textbox")
        .click();
      await page.getByRole("option", { name: brand, exact: true }).click();
    }

    for (const brand of excludeBrands) {
      await page
        .locator("select#exclude_product_brands + span.select2")
        .getByRole("textbox")
        .click();
      await page.getByRole("option", { name: brand, exact: true }).click();
    }

    await page.getByRole("button", { name: "Publish", exact: true }).click();

    // assert that we see the "Coupon updated." notice message.
    await expect(page.getByText("Coupon updated.")).toBeVisible();

    // go back to the Coupons page.
    await goToCouponsPage();
  };

  await login("admin", "password");
  await fixShopPage404Error();

  await goToBrandsPage();
  await createBrandIfNotExist(
    "WooCommerce",
    "woocommerce",
    "None",
    "All things WooCommerce!",
    "album-1.jpg"
  );

  // Create child brand under the "WooCommerce" parent brand.
  await createBrandIfNotExist(
    "WooCommerce Apparels",
    "woocommerce-apparels",
    "WooCommerce",
    "Cool WooCommerce clothings!",
    "single-1.jpg"
  );

  // Create a dummy child brand called "WooCommerce Dummy" under the "WooCommerce" parent brand.
  await createBrandIfNotExist(
    "WooCommerce Dummy",
    "woocommerce-dummy",
    "WooCommerce",
    "Dummy WooCommerce brand!",
    "single-1.jpg"
  );

  // Edit the dummy child brand from "WooCommerce Dummy" to "WooCommerce Dummy Edited".
  await editBrand("WooCommerce Dummy", {
    name: "WooCommerce Dummy Edited",
    slug: "woocommerce-dummy-edited",
    parentBrand: "WooCommerce",
    description: "Dummy WooCommerce brand edited!",
    thumbnailFileName: "sunglasses-2.jpg",
  });

  // Delete the dummy child brand "WooCommerce Dummy Edited".
  await deleteBrand("WooCommerce Dummy Edited");

  await goToCouponsPage();
  await addCoupon({
    code: "10OFFWOOAPPARELS",
    description: "USD 10 off for WooCommerce apparels.",
    general: {
      discountType: "Fixed cart discount",
      couponAmount: "10",
    },
    usageRestriction: {
      productBrands: ["WooCommerce Apparels"],
      excludeBrands: [],
    },
  });
});
