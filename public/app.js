const toCurrency = (price) =>
  new Intl.NumberFormat('ru-RU', {
    currency: 'rub',
    style: 'currency',
  }).format(price)

const toDate = (date) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date))

document.querySelectorAll('.price').forEach((node) => {
  node.textContent = toCurrency(node.textContent)
})

document.querySelectorAll('.date').forEach((node) => {
  node.textContent = toDate(node.textContent)
})

const $cart = document.getElementById('cart')

if ($cart) {
  $cart.addEventListener('click', (e) => {
    if (e.target.classList.contains('js-remove')) {
      const id = e.target.dataset.id
      const csrf = e.target.dataset.csrf

      fetch('/cart/remove/' + id, {
        method: 'delete',
        headers: {
          'X-XSRF-TOKEN': csrf,
        },
      })
        .then((res) => res.json())
        .then((cart) => {
          if (cart.courses.length) {
            const tbody = $cart.querySelector('tbody')
            const price = $cart.querySelector('.price')
            const html = cart.courses
              .map(
                ({ title, count, _id }) =>
                  `<tr>
                    <td>${title}</td>
                    <td>${count}</td>
                    <td>
                      <button class='btn btn-small js-remove' data-id='${_id}'>
                        Удалить
                      </button>
                    </td>
                  </tr>`
              )
              .join('')

            tbody.innerHTML = html
            price.textContent = toCurrency(cart.price)
          } else {
            $cart.innerHTML = '<p>Корзина пуста</p>'
          }
        })
    }
  })
}

M.Tabs.init(document.querySelectorAll('.tabs'))
