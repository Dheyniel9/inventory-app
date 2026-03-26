<?php
$SUPABASE_URL = getenv('SUPABASE_URL') ?: '';
$SUPABASE_ANON_KEY = getenv('SUPABASE_ANON_KEY') ?: '';

function supabase_request(string $method, string $path, ?array $payload = null): array
{
    global $SUPABASE_URL, $SUPABASE_ANON_KEY;

    if ($SUPABASE_URL === '' || $SUPABASE_ANON_KEY === '') {
        return ['ok' => false, 'status' => 0, 'body' => null, 'error' => 'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.'];
    }

    $url = rtrim($SUPABASE_URL, '/') . '/rest/v1/' . ltrim($path, '/');

    $headers = [
        'apikey: ' . $SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . $SUPABASE_ANON_KEY,
        'Content-Type: application/json',
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    }

    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return ['ok' => false, 'status' => $status, 'body' => null, 'error' => $curlError ?: 'Unknown cURL error'];
    }

    $decoded = json_decode($response, true);

    return [
        'ok' => $status >= 200 && $status < 300,
        'status' => $status,
        'body' => $decoded,
        'error' => $status >= 200 && $status < 300 ? null : $response,
    ];
}

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'add_product') {
        $name = trim($_POST['name'] ?? '');
        $price = $_POST['price'] ?? '';

        if ($name === '' || !is_numeric($price)) {
            $message = 'Please provide a valid product name and price.';
        } else {
            $result = supabase_request('POST', 'products', [[
                'name' => $name,
                'price' => (float)$price,
            ]]);

            $message = $result['ok'] ? 'Product added.' : 'Failed to add product.';
        }
    }

    if ($action === 'delete_product') {
        $id = $_POST['id'] ?? '';

        if (!ctype_digit((string)$id)) {
            $message = 'Invalid product id.';
        } else {
            $result = supabase_request('DELETE', 'products?id=eq.' . (int)$id);
            $message = $result['ok'] ? 'Product deleted.' : 'Failed to delete product.';
        }
    }
}

$listResult = supabase_request('GET', 'products?select=id,name,price&order=id.desc');
$products = $listResult['ok'] && is_array($listResult['body']) ? $listResult['body'] : [];

function money(float $value): string
{
    return '$' . number_format($value, 2);
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Inventory POS (PHP)</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-stone-100 via-emerald-50 to-amber-50 text-slate-900">
  <main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <header class="mb-5">
      <p class="inline-block rounded-full border border-emerald-300/60 bg-emerald-100/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">PHP Mode</p>
      <h1 class="mt-3 text-3xl font-extrabold sm:text-4xl">Inventory + POS</h1>
      <p class="mt-2 text-sm text-slate-700">Name and price only. Click products to build a sale, then calculate change.</p>
    </header>

    <?php if ($message !== ''): ?>
      <div class="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800"><?= htmlspecialchars($message) ?></div>
    <?php endif; ?>

    <?php if ($SUPABASE_URL === '' || $SUPABASE_ANON_KEY === ''): ?>
      <div class="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
        Set SUPABASE_URL and SUPABASE_ANON_KEY before running this PHP page.
      </div>
    <?php endif; ?>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
      <article class="rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30">
        <h2 class="mb-3 text-lg font-semibold">Add Product</h2>
        <form method="post" class="grid gap-3">
          <input type="hidden" name="action" value="add_product" />

          <label class="grid gap-1 text-sm font-medium text-slate-700">
            Product name
            <input name="name" required class="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200" />
          </label>

          <label class="grid gap-1 text-sm font-medium text-slate-700">
            Price
            <input name="price" required type="number" min="0" step="0.01" class="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200" />
          </label>

          <button class="rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Add Product</button>
        </form>
      </article>

      <article class="rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Inventory</h2>
          <span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"><?= count($products) ?> items</span>
        </div>

        <div id="product-grid" class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <?php foreach ($products as $product): ?>
            <div class="rounded-xl border border-slate-200 bg-white p-3">
              <button
                type="button"
                class="w-full text-left"
                data-pos-product
                data-id="<?= (int)$product['id'] ?>"
                data-name="<?= htmlspecialchars((string)$product['name']) ?>"
                data-price="<?= (float)$product['price'] ?>"
              >
                <p class="text-sm font-semibold text-slate-900"><?= htmlspecialchars((string)$product['name']) ?></p>
                <p class="text-xs text-slate-600">Price: <?= money((float)$product['price']) ?></p>
                <p class="mt-2 text-xs font-semibold text-emerald-700" data-selected="<?= (int)$product['id'] ?>">Selected: 0</p>
              </button>

              <form method="post" class="mt-2">
                <input type="hidden" name="action" value="delete_product" />
                <input type="hidden" name="id" value="<?= (int)$product['id'] ?>" />
                <button class="w-full rounded-lg bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200">Delete</button>
              </form>
            </div>
          <?php endforeach; ?>
        </div>
      </article>
    </section>

    <section class="mt-4 rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold">POS Checkout</h2>
        <button id="clear-sale" type="button" class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Clear Sale</button>
      </div>

      <div id="cart-list" class="mb-4 grid gap-2 text-sm text-slate-700">
        <p class="text-sm text-slate-600">No items selected yet.</p>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p class="text-xs uppercase tracking-wide text-slate-500">Total Amount</p>
          <p id="sale-total" class="text-2xl font-extrabold text-slate-900">$0.00</p>
        </div>

        <label class="grid gap-1 text-sm font-medium text-slate-700">
          Money Given
          <input id="cash-given" type="number" min="0" step="0.01" placeholder="0.00" class="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200" />
        </label>

        <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p class="text-xs uppercase tracking-wide text-slate-500">Change</p>
          <p id="change" class="text-xl font-bold text-emerald-700">$0.00</p>
        </div>
      </div>

      <p id="pos-message" class="mt-3 text-sm font-medium text-sky-800"></p>
    </section>
  </main>

  <script>
    const cart = {};
    const productButtons = document.querySelectorAll('[data-pos-product]');
    const cartList = document.getElementById('cart-list');
    const saleTotalEl = document.getElementById('sale-total');
    const cashGivenEl = document.getElementById('cash-given');
    const changeEl = document.getElementById('change');
    const posMessageEl = document.getElementById('pos-message');
    const clearSaleBtn = document.getElementById('clear-sale');

    function formatMoney(value) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }

    function getProductsFromButtons() {
      return Array.from(productButtons).map((btn) => ({
        id: Number(btn.dataset.id),
        name: btn.dataset.name,
        price: Number(btn.dataset.price),
      }));
    }

    function render() {
      const products = getProductsFromButtons();
      const items = products
        .map((p) => ({ ...p, quantity: cart[p.id] || 0 }))
        .filter((p) => p.quantity > 0);

      const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const cash = Number.parseFloat(cashGivenEl.value || '0');
      const hasCash = !Number.isNaN(cash);
      const change = hasCash ? cash - total : 0;

      if (items.length === 0) {
        cartList.innerHTML = '<p class="text-sm text-slate-600">No items selected yet.</p>';
      } else {
        cartList.innerHTML = items
          .map((item) =>
            '<div class="rounded-xl border border-slate-200 bg-white px-3 py-2">'
              + '<div class="flex items-center justify-between gap-2">'
                + '<p class="text-sm font-semibold text-slate-900">' + item.name + '</p>'
                + '<p class="text-sm font-semibold text-slate-800">' + formatMoney(item.quantity * item.price) + '</p>'
              + '</div>'
              + '<p class="mt-1 text-xs text-slate-600">' + item.quantity + ' x ' + formatMoney(item.price) + '</p>'
            + '</div>'
          )
          .join('');
      }

      saleTotalEl.textContent = formatMoney(total);
      changeEl.textContent = formatMoney(change);
      changeEl.className = change < 0 ? 'text-xl font-bold text-rose-700' : 'text-xl font-bold text-emerald-700';

      products.forEach((p) => {
        const selectedEl = document.querySelector('[data-selected="' + p.id + '"]');
        if (selectedEl) selectedEl.textContent = 'Selected: ' + (cart[p.id] || 0);
      });
    }

    productButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.id);
        cart[id] = (cart[id] || 0) + 1;
        posMessageEl.textContent = '';
        render();
      });
    });

    cashGivenEl.addEventListener('input', () => {
      posMessageEl.textContent = '';
      render();
    });

    clearSaleBtn.addEventListener('click', () => {
      Object.keys(cart).forEach((id) => delete cart[id]);
      cashGivenEl.value = '';
      posMessageEl.textContent = '';
      render();
    });

    render();
  </script>
</body>
</html>
