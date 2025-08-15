const API_BASE = 'http://localhost:3000';

//1.  LOGIN for both login.html & index.html
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    // input boxes may appear with different IDs on the two pages
    const nameInput = document.getElementById('name')            || document.getElementById('Name');
    const idInput   = document.getElementById('customerId')      || document.getElementById('customerIdInput');
    const errorElem = document.getElementById('loginError')      || document.getElementById('loginErrorMsg');

    if (!loginButton || !nameInput || !idInput || !errorElem) return;

    loginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        errorElem.textContent = '';              // clear old error

        const name = nameInput.value.trim();
        const id   = idInput.value.trim();

        if (!name || !id) {
            errorElem.textContent = 'Please enter both Name and Customer ID';
            return;
        }

        try {
            const resp = await fetch(`${API_BASE}/api/customers/${id}`);
            if (resp.status === 404) { errorElem.textContent = 'Account does not exist'; return; }
            if (!resp.ok)            { errorElem.textContent = 'Server error, please try again'; return; }

            const data = await resp.json();
            if (data.name === name) {
                localStorage.setItem('currentUserId', id);
                window.location.href = 'home.html';
            } else {
                errorElem.textContent = 'Name does not match';
            }
        } catch {
            errorElem.textContent = 'Network error';
        }
    });
});

// 2.  GENERIC POP-UP (all pages)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.popup_button').forEach(btn => {
        const popup = btn.nextElementSibling;
        if (!popup) return;

        const box = popup.querySelector('.popup_box');
        // inject top-right “×” once
        if (box && !box.querySelector('.close_icon')) {
            const icon = document.createElement('button');
            icon.className = 'close_icon';
            icon.textContent = '×';
            icon.onclick = () => popup.classList.remove('active');
            box.appendChild(icon);
        }

        // bottom close_btn (if any) already exists
        const closeBtn = popup.querySelector('.close_btn');
        if (closeBtn) closeBtn.onclick = () => popup.classList.remove('active');

        // open popup
        btn.onclick = () => popup.classList.add('active');
    });
});


//3.  SIGN-UP  (create new customer)
document.addEventListener('DOMContentLoaded', () => {
    const createBtn       = document.getElementById('createBtn');
    const signupModal     = document.getElementById('signupModal');
    const signupModalMsg  = document.getElementById('signupModalMsg');
    const signupModalBtn  = document.getElementById('signupModalBtn');
    const errorElem       = document.getElementById('signupError');

    if (!createBtn || !signupModal || !signupModalMsg || !signupModalBtn || !errorElem) return;

    createBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        errorElem.textContent = '';

        //gather input
        const name      = document.getElementById('name').value.trim();
        const country   = document.getElementById('country').value.trim();
        const postal    = document.getElementById('postalcode').value.trim();
        const province  = document.getElementById('province').value.trim();
        const city      = document.getElementById('city').value.trim();
        const streetNum = document.getElementById('streetNum').value.trim();
        const unit      = document.getElementById('unit').value.trim();

        if (!name || !country || !postal || !province || !city || !streetNum || !unit) {
            errorElem.textContent = 'Please fill all fields.';
            return;
        }

        //build request body
        const payload = { name, country, postalcode: postal, province, city,
            streetNum, unit };

        try {
            const resp = await fetch(`${API_BASE}/api/customers`, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify(payload)
            });

            if (resp.status === 409) {            // duplicate customer
                errorElem.textContent = 'User already exists';
                return;
            }
            if (!resp.ok) {
                errorElem.textContent = 'Signup failed, please try again';
                return;
            }

            const data = await resp.json();
            localStorage.setItem('currentUserId', data.id);
            console.log('Signup response', data); // for dev-tools debugging

            // show success modal
            signupModal.style.display = 'flex';        // <-- ensure element is visible
            signupModalMsg.textContent = `Signup successful! Your ID: ${data.id}`;

            signupModal.classList.add('active');       // triggers CSS fade-in

            signupModalBtn.onclick = () => {
                signupModal.classList.remove('active');
                window.location.href = 'home.html';
            };
        } catch {
            errorElem.textContent = 'Network error';
        }
    });
});

//  SHOW USER ID ON home.html
document.addEventListener('DOMContentLoaded', () => {
    const userBox = document.getElementById('userBox'); // element only exists on home.html
    if (!userBox) return;                               // ignore other pages

    const id = localStorage.getItem('currentUserId');   // read stored id
    if (id) {
        userBox.textContent = `User ID: ${id}`;         // display id
    } else {
        userBox.style.display = 'none';                 // hide box when not logged in
    }
});

// HOME-PAGE pop-up (executes only when buttons exist)
document.addEventListener('DOMContentLoaded', () => {
    // runs on pages that contain .popup_button (home.html only)
    const buttons = document.querySelectorAll('.popup_button');
    if (buttons.length === 0) return;   // exit for all other pages

    // fixed mapping: restaurant name -> database id
    const restMap = {
        'SUBWAY': 1,
        'A&W': 2,
        "Steve's Poke": 3,
        'DownLow Chicken': 4,
        'McDonalds': 5,
        'Tim Hortons': 6
    };

    buttons.forEach(btn => {
        const popup    = btn.nextElementSibling;
        const closeBtn = popup?.querySelector('.close_btn');
        if (!popup || !closeBtn) return;

        // open popup & load menu
        btn.onclick = async () => {
            popup.classList.add('active');
            const restId = restMap[btn.textContent.trim()];
            if (!restId) return;

            try {
                const resp  = await fetch(`${API_BASE}/api/restaurants/${restId}/items`);
                if (!resp.ok) return;
                const items = await resp.json();

                // remove old list then build a fresh one
                const box = popup.querySelector('.popup_box');
                let ul    = box.querySelector('.item_list');
                if (ul) ul.remove();
                ul = document.createElement('ul');
                ul.className = 'item_list';

                items.forEach(it => {
                    const li = document.createElement('li');
                    li.textContent = `${it.name} - $${it.price} `;

                    const addBtn = document.createElement('button');
                    addBtn.textContent = 'Add';
                    addBtn.className   = 'add_btn';
                    addBtn.onclick = () => {
                        const cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
                        cart.push({ id: it.id, name: it.name, price: it.price });
                        localStorage.setItem('cartItems', JSON.stringify(cart));
                    };

                    li.appendChild(addBtn);
                    ul.appendChild(li);
                });
                box.appendChild(ul);
            } catch (err) {
                console.error(err);
            }
        };

        // close popup
        closeBtn.onclick = () => popup.classList.remove('active');
    });


});



// BEST-RATED loader
document.addEventListener('DOMContentLoaded', () => {
    // only runs when Best Rated button exists
    const bestBtn = [...document.querySelectorAll('.popup_button')]
        .find(b => b.textContent.trim() === 'Best Rated');
    if (!bestBtn) return;


    const popup    = bestBtn.nextElementSibling;
    const applyBtn = popup.querySelector('#applyRating');
    const select   = popup.querySelector('#ratingSelect');
    const listDiv  = popup.querySelector('#bestRatedList');
    const closeBtn = popup.querySelector('.close_btn');
    const countBtn  = popup.querySelector('#countRating');
    const countSpan = popup.querySelector('#countResult');


    // open popup (reuse generic open already wired)
    // add apply handler once
    applyBtn.onclick = async () => {
        const min = Number(select.value);
        try {
            const resp = await fetch(`${API_BASE}/api/restaurants/best/${min}`);
            if (!resp.ok) return;
            const rests = await resp.json();

            // build list
            listDiv.innerHTML = '';
            const ul = document.createElement('ul');
            rests.forEach(r => {
                const li = document.createElement('li');
                li.textContent = `${r.name} (rating ${Number(r.avg_rating).toFixed(1)})`;
                ul.appendChild(li);
            });
            listDiv.appendChild(ul);
        } catch (err) {
            console.error(err);
        }
    };

    countBtn.onclick = async () => {
        const min = Number(select.value);
        try {
            const resp = await fetch(`${API_BASE}/api/restaurants/bestcount/${min}`);
            if (!resp.ok) { countSpan.textContent = 'Error'; return; }
            const data = await resp.json();            // { cnt: N }
            countSpan.textContent = `Total: ${data.cnt}`;
        } catch { countSpan.textContent = 'Network'; }
    };


    // close button already wired by generic handler
});


//Add-Review loader
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = [...document.querySelectorAll('.popup_button')]
        .find(b => b.textContent.trim() === 'Add Review');
    if (!addBtn) return;

    const popup = addBtn.nextElementSibling;
    const listDiv = popup.querySelector('#reviewRestList');

    // restaurant map reused
    const restMap = {
        'SUBWAY': 1, 'A&W': 2, "Steve's Poke": 3,
        'DownLow Chicken': 4, 'McDonalds': 5, 'Tim Hortons': 6
    };

    // build list once on first open
    let built = false;
    addBtn.onclick = () => {
        popup.classList.add('active');
        if (built) return;
        const ul = document.createElement('ul');
        Object.entries(restMap).forEach(([name, id]) => {
            const li = document.createElement('li');
            li.textContent = name + ' ';
            const btn = document.createElement('button');
            btn.textContent = 'Add Review';
            btn.onclick = () => openRatingModal(id, name);
            li.appendChild(btn);
            ul.appendChild(li);
        });
        listDiv.appendChild(ul);
        built = true;
    };

    //add review
    const openRatingModal = (restId, restName) => {
        // modal shell
        const modal = document.createElement('div');
        modal.className = 'popup_container';
        modal.innerHTML = `
            <div class="popup_box" style="position:relative">
                <button class="close_icon">×</button>
                <h1 style="margin-top:20px;font-size:15px">${restName}</h1>
                <label>Rating (0-5): </label>
                <input id="ratingInput" type="number" min="0" max="5" step="1" value="5"/>
                <button id="ratingAdd">Add</button>
                <button class="close_btn">Cancel</button>
            </div>`;

        document.body.appendChild(modal);
        modal.classList.add('active');

        modal.querySelector('.close_btn').onclick = () => modal.remove();
        modal.querySelector('.close_icon').onclick = () => modal.remove();

        modal.querySelector('#ratingAdd').onclick  = async () => {
            const rating = Number(modal.querySelector('#ratingInput').value);
            const custid = localStorage.getItem('currentUserId');
            if (!custid) { alert('Not logged in'); return; }
            if (![0,1,2,3,4,5].includes(rating)) { alert('Invalid rating'); return; }

            try {
                const resp = await fetch(`${API_BASE}/api/reviews`, {
                    method: 'POST',
                    headers: { 'Content-Type':'application/json' },
                    body: JSON.stringify({ custid, restid: restId, rating })
                });
                if (!resp.ok) { alert('Failed'); return; }
                alert('Review added');
                modal.remove();
            } catch { alert('Network error'); }
        };
    };
});

// Review-history loader
document.addEventListener('DOMContentLoaded', () => {
    const histBtn = [...document.querySelectorAll('.popup_button')]
        .find(b => b.textContent.trim() === 'Review History');
    if (!histBtn) return;

    const popup   = histBtn.nextElementSibling;
    const listDiv = popup.querySelector('#myReviewList');

    const renderList = async () => {
        const custid = localStorage.getItem('currentUserId');
        if (!custid) { listDiv.textContent = 'Not logged in'; return; }
        try {
            const resp = await fetch(`${API_BASE}/api/reviews/user/${custid}`);
            if (!resp.ok) { listDiv.textContent = 'Load failed'; return; }
            const rows = await resp.json();

            listDiv.innerHTML = '';
            if (rows.length === 0) { listDiv.textContent = 'No reviews yet'; return; }

            const ul = document.createElement('ul');
            rows.forEach(r => {
                const li = document.createElement('li');
                li.textContent = `${r.rest_name} - ${r.rating} `;
                const del = document.createElement('button');
                del.textContent = 'Delete';
                del.onclick = async () => {
                    const res = await fetch(`${API_BASE}/api/reviews/${r.review_id}`, { method: 'DELETE' });
                    if (res.ok) { renderList(); }
                    else        { alert('Delete failed'); }
                };
                li.appendChild(del);
                ul.appendChild(li);
            });
            listDiv.appendChild(ul);
        } catch { listDiv.textContent = 'Network error'; }
    };

    // open popup & load list
    histBtn.onclick = () => {
        popup.classList.add('active');
        renderList();
    };
});

// Good-Reviewers loader (division query)
document.addEventListener('DOMContentLoaded', () => {
    const goodBtn = [...document.querySelectorAll('.popup_button')]
        .find(b => b.textContent.trim() === 'Good Reviewers');
    if (!goodBtn) return;

    const popup   = goodBtn.nextElementSibling;
    const listDiv = popup.querySelector('#goodReviewerList');

    const renderGood = async () => {
        try {
            const resp = await fetch(`${API_BASE}/api/reviews/good`);
            if (!resp.ok) { listDiv.textContent = 'Load failed'; return; }
            const rows = await resp.json();

            listDiv.innerHTML = '';
            if (rows.length === 0) { listDiv.textContent = 'No such customer'; return; }

            const ul = document.createElement('ul');
            rows.forEach(r => {
                const li = document.createElement('li');
                li.textContent = `${r.id}  –  ${r.name}`;
                ul.appendChild(li);
            });
            listDiv.appendChild(ul);
        } catch { listDiv.textContent = 'Network error'; }
    };

    // open popup & load list
    goodBtn.onclick = () => {
        popup.classList.add('active');
        renderGood();
    };
});


// cart page loader
document.addEventListener('DOMContentLoaded', async() => {
    // detect cart.html by specific heading text
    const cartTitle = document.querySelector('.content_container h3');
    if (!cartTitle || cartTitle.textContent !== 'Items in Cart:') return; // run only on cart.html

    // ensure a <ul> exists to list items
    const parent = cartTitle.parentElement;
    let ul = parent.querySelector('.cart_list');
    if (!ul) {
        ul = document.createElement('ul');
        ul.className = 'cart_list';
        parent.appendChild(ul);
    }

    // locate or create total-price heading
    let totalElem = [...parent.querySelectorAll('h3')]
        .find(h => h.textContent.startsWith('Total Price'));
    if (!totalElem) {
        totalElem = document.createElement('h3');
        totalElem.textContent = 'Total Price: $0.00';
        parent.appendChild(totalElem);
    }


    // load saved cards into dropdown
    const cardSelect = document.getElementById('cardSelect');
    if (cardSelect) {
        const custid = localStorage.getItem('currentUserId');
        if (custid) {
            try {
                const resp = await fetch(`${API_BASE}/api/payments/user/${custid}`);
                if (resp.ok) {
                    const cards = await resp.json();
                    cardSelect.innerHTML = '';
                    cards.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.cardnumber;
                        opt.textContent = `${c.cardnumber}  (exp ${c.expireddate})`;
                        cardSelect.appendChild(opt);
                    });
                } else {
                    cardSelect.innerHTML = '<option>No saved cards</option>';
                }
            } catch {
                cardSelect.innerHTML = '<option>Load failed</option>';
            }
        } else {
            cardSelect.innerHTML = '<option>Not logged in</option>';
        }
    }


    // load customers into custid_select dropdown
    const custSelect = document.getElementById('custid_select');
    if (custSelect) {
        try {
            const resp = await fetch(`${API_BASE}/api/customers/list`);
            if (resp.ok) {
                const customers = await resp.json();
                custSelect.innerHTML = '';
                customers.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = `${c.id} - ${c.name}`;
                    custSelect.appendChild(opt);
                });
            } else {
                custSelect.innerHTML = '<option>Load failed</option>';
            }
        } catch {
            custSelect.innerHTML = '<option>Network error</option>';
        }
    }




    // load cart from localStorage and render
    const cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    ul.innerHTML = '';
    let total = 0;

    cart.forEach(it => {
        const li = document.createElement('li');
        li.textContent = `${it.name} - $${it.price}`;
        ul.appendChild(li);
        total += Number(it.price);
    });

    // handle "Save" inside Payment Form
    const saveBtn = document.getElementById('savePaymentBtn');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const custid  = custSelect ? custSelect.value : '';

            const card    = document.getElementById('cardnumber').value.trim();
            const expDate = document.getElementById('expireddate').value;      // already YYYY-MM-DD
            const cvv     = document.getElementById('CVV').value.trim();

            if (!custid || !card || !expDate || !cvv) { alert('All fields required'); return; }

            try {
                const resp = await fetch(`${API_BASE}/api/payments`, {
                    method : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body   : JSON.stringify({ custid, card, expDate, cvv })
                });

                if (resp.ok) {
                    alert('Payment info saved');
                    // refresh dropdown after change
                    const r = await fetch(`${API_BASE}/api/payments/user/${custid}`);
                    if (r.ok) {
                        const cards = await r.json();
                        cardSelect.innerHTML = '';
                        cards.forEach(c => {
                            const opt = document.createElement('option');
                            opt.value = c.cardnumber;
                            opt.textContent = `${c.cardnumber}  (exp ${c.expireddate})`;
                            cardSelect.appendChild(opt);
                        });
                    }

                } else if (resp.status === 400) {
                    const err = await resp.json();
                    alert(err.error);
                } else {
                    alert('Server error');
                }
            } catch { alert('Network error'); }

            // close popup no matter success / failure
            saveBtn.parentElement.parentElement.classList.remove('active');
        };
    }

    // checkout: verify card belongs to current user, then clear cart
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            const selectedCard = cardSelect ? cardSelect.value : null;
            if (!selectedCard) { alert('Select a card first'); return; }

            const custid = localStorage.getItem('currentUserId');

            // verify card belongs to user
            try {
                const ver = await fetch(`${API_BASE}/api/payments/card/${selectedCard}`);
                if (!ver.ok) { alert('Card lookup failed'); return; }
                const data = await ver.json();
                if (String(data.custid) !== String(custid)) {
                    alert('Payment customer id mismatch');
                    return;
                }
            } catch { alert('Network error'); return; }

            // build checkout payload
            const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
            if (cartItems.length === 0) { alert('Cart empty'); return; }

            try {
                const resp = await fetch(`${API_BASE}/api/checkout`, {
                    method : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body   : JSON.stringify({ custid, card: selectedCard, items: cartItems })
                });

                if (!resp.ok) { alert('Checkout failed'); return; }

                // success → clear cart & UI
                localStorage.setItem('cartItems', '[]');
                ul.innerHTML = '';
                totalElem.textContent = 'Total Price: $0.00';
                alert('Checkout successful');
            } catch { alert('Network error'); }
        };
    }




    totalElem.textContent = `Total Price: $${total.toFixed(2)}`;
});


//order loader
document.addEventListener('DOMContentLoaded', () => {
    const pageTitle = document.querySelector('h3');
    if (!pageTitle || pageTitle.textContent !== 'Past Orders') return;
    const container = document.querySelector('.content_container');
    const custid = localStorage.getItem('currentUserId');
    if (!custid) {
        container.textContent = 'Not logged in';
        return;
    }
    fetch(`${API_BASE}/api/orders/user/${custid}`)
        .then(r => r.json())
        .then(list => {
            container.innerHTML = '';
            if (list.length === 0) {
                container.textContent = 'No orders';
                return;
            }
            list.forEach(o => {
                const div = document.createElement('div');
                div.className = 'order_block';
                const head = document.createElement('h4');
                head.textContent = `Order ${o.order_number}  Total $${o.total}  ${o.restaurant}  Card ${o.cardnumber}`;
                div.appendChild(head);
                const ul = document.createElement('ul');
                o.items.forEach(it => {
                    const li = document.createElement('li');
                    li.textContent = `${it.name} ×${it.quantity}`;
                    ul.appendChild(li);
                });
                div.appendChild(ul);
                container.appendChild(div);
            });
        })
        .catch(() => {
            container.textContent = 'Load failed';
        });
});

