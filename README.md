
# Parvez Nova Electronics — Full E-commerce Website

## Brand
Recommended website/shop brand: **Parvez Nova Electronics**
Tagline: **Powering What Matters.**

The web search found that “Parvez Electronics” is already used by other businesses, so the longer Nova name is more distinctive. It is not a trademark/domain clearance.

## Customer website
Open `/` to:
- browse products
- search products
- add to cart
- checkout
- collect name, phone, email, full address, city and PIN
- create an order ID
- support Cash on Delivery

## Admin
Open `/admin`.
Default:
- Username: admin
- Password: ChangeMe123!

Admin can:
- Add products
- Upload product images (JPG/PNG/WEBP/GIF up to 5 MB)
- Set selling price
- Set MRP/old price
- Set stock
- Set category and description
- Edit basic product details
- Delete products
- View every customer order and delivery detail
- Update order status

## How you upload products
1. Start the server.
2. Open `/admin`.
3. Log in.
4. Use **Add New Product**.
5. Enter product name, category, selling price, MRP, stock and description.
6. Choose the product photo in **Upload image**.
7. Click **Add Product**.
8. It immediately appears on the customer website.

## Run on a computer/server
Install Node.js 18+.
Then:
npm install
npm start

Open:
http://localhost:3000
Admin:
http://localhost:3000/admin

## Before making it public
Change the admin password, set a strong SESSION_SECRET, use HTTPS/secure cookies, and move the JSON storage to a production database. Add payment gateway, email/SMS/WhatsApp notifications and legal pages if needed.


## Premium UI
The customer storefront has been redesigned with a premium dark/cream/gold visual system, responsive mobile layout, sticky navigation, curated hero section, category cards, product search, product cards and floating cart checkout.
