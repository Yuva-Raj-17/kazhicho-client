import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function App() {
  const [page, setPage] = useState('home');
  const [menu, setMenu] = useState(sampleMenu());
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [truckLocation, setTruckLocation] = useState({ lat: 12.9716, lng: 77.5946 });

  useEffect(() => {
    const socket = io('http://localhost:4000');
    socket.on('truckLocation', loc => setTruckLocation(loc));
    socket.on('newOrder', o => setOrders(prev => [o, ...prev]));
    // cleanup
    return () => socket.disconnect();
  }, []);

  const addToCart = (item) => setCart(c => [...c, item]);
  const clearCart = () => setCart([]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Kazhicho</h1>
            <nav className="hidden md:flex gap-3 text-sm text-gray-600">
              <button onClick={() => setPage('home')} className="hover:underline">Home</button>
              <button onClick={() => setPage('menu')} className="hover:underline">Menu</button>
              <button onClick={() => setPage('orders')} className="hover:underline">Orders</button>
              <button onClick={() => setPage('admin')} className="hover:underline">Admin</button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700">Live: {truckLocation.lat.toFixed(4)}, {truckLocation.lng.toFixed(4)}</div>
            <button onClick={() => setPage('cart')} className="bg-green-600 text-white px-3 py-2 rounded">Cart ({cart.length})</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {page === 'home' && (
          <section>
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div>
                <h2 className="text-3xl font-semibold">Kazhicho — Street flavours, fresh daily</h2>
                <p className="mt-3 text-gray-600">Order online, track the truck, get notified when we're near you.</p>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setPage('menu')} className="px-4 py-2 bg-yellow-500 rounded">Order Now</button>
                  <button onClick={() => setPage('track')} className="px-4 py-2 border rounded">Track Truck</button>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden shadow">
                <MapView location={truckLocation} />
              </div>
            </div>

            <section className="mt-8">
              <h3 className="text-xl font-medium">Popular items</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {menu.slice(0,6).map(i => <MenuCard key={i.id} item={i} onAdd={() => addToCart(i)} />)}
              </div>
            </section>
          </section>
        )}

        {page === 'menu' && (
          <section>
            <h2 className="text-2xl font-semibold">Menu</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {menu.map(i => <MenuCard key={i.id} item={i} onAdd={() => addToCart(i)} />)}
            </div>
          </section>
        )}

        {page === 'cart' && (
          <section>
            <h2 className="text-2xl font-semibold">Your Cart</h2>
            <CartDrawer cart={cart} onClear={clearCart} onCheckout={() => setPage('checkout')} />
          </section>
        )}

        {page === 'checkout' && (
          <section>
            <h2 className="text-2xl font-semibold">Checkout</h2>
            <OrderForm cart={cart} onPlaced={(o) => { setOrders([o, ...orders]); clearCart(); setPage('orders'); }} />
          </section>
        )}

        {page === 'orders' && (
          <section>
            <h2 className="text-2xl font-semibold">Orders</h2>
            <div className="mt-4">
              {orders.length === 0 ? <div className="text-gray-500">No orders yet.</div> : (
                <ul className="space-y-3">
                  {orders.map(o => (
                    <li key={o.id} className="p-3 bg-white shadow rounded flex justify-between">
                      <div>
                        <div className="font-medium">#{o.id} — {o.customer_name}</div>
                        <div className="text-sm text-gray-600">{o.items?.length || 0} items • ₹{((o.total||0)/100).toFixed(2)}</div>
                      </div>
                      <div className="text-sm text-gray-700">{o.status}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {page === 'track' && (
          <section>
            <h2 className="text-2xl font-semibold">Live Truck Location</h2>
            <div className="mt-4 rounded shadow overflow-hidden"><MapView location={truckLocation} /></div>
          </section>
        )}

        {page === 'admin' && (
          <section>
            <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
            <AdminPanel orders={orders} menu={menu} onUpdateMenu={(m) => setMenu(m)} />
          </section>
        )}
      </main>

      <footer className="bg-white border-t py-4 mt-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">© {new Date().getFullYear()} Kazhicho</div>
      </footer>
    </div>
  );
}

function MenuCard({ item, onAdd }){
  return (
    <div className="bg-white rounded p-3 shadow flex flex-col">
      <img src={item.image_url} alt="" className="h-36 w-full object-cover rounded" />
      <div className="mt-2 flex-1">
        <div className="font-medium">{item.name}</div>
        <div className="text-sm text-gray-600">{item.description}</div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="font-semibold">₹{(item.price_cents/100).toFixed(2)}</div>
        <button onClick={onAdd} className="px-3 py-1 bg-green-600 text-white rounded">Add</button>
      </div>
    </div>
  );
}

function CartDrawer({ cart, onClear, onCheckout }){
  const total = cart.reduce((s,i)=> s + i.price_cents, 0);
  return (
    <div className="mt-4">
      {cart.length === 0 ? <div className="text-gray-500">Cart is empty</div> : (
        <div className="bg-white p-4 rounded shadow">
          <ul className="divide-y">
            {cart.map((c, idx) => (
              <li key={idx} className="py-2 flex justify-between"><div>{c.name}</div><div>₹{(c.price_cents/100).toFixed(2)}</div></li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between items-center">
            <div className="font-semibold">Total ₹{(total/100).toFixed(2)}</div>
            <div className="flex gap-2">
              <button onClick={onClear} className="px-3 py-1 border rounded">Clear</button>
              <button onClick={onCheckout} className="px-3 py-1 bg-yellow-500 rounded">Checkout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderForm({ cart, onPlaced }){
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const total = cart.reduce((s,i)=> s + i.price_cents, 0);

  const place = async () => {
    const payload = { customer_name: name, customer_phone: phone, items: cart, total };
    // demo: local optimistic order
    const demoOrder = { id: Date.now(), ...payload, status: 'received' };
    onPlaced(demoOrder);
    // uncomment for real:
    // const res = await fetch('http://localhost:4000/api/orders', { method:'POST', body: JSON.stringify(payload), headers:{'Content-Type':'application/json'} });
    // const order = await res.json();
    // onPlaced(order);
  };

  return (
    <div className="max-w-md">
      <div className="bg-white p-4 rounded shadow">
        <label className="block text-sm">Name</label>
        <input className="w-full border rounded p-2 mt-1" value={name} onChange={e=>setName(e.target.value)} />
        <label className="block text-sm mt-3">Phone</label>
        <input className="w-full border rounded p-2 mt-1" value={phone} onChange={e=>setPhone(e.target.value)} />
        <div className="mt-3 flex justify-between items-center">
          <div className="font-semibold">Total ₹{(total/100).toFixed(2)}</div>
          <button onClick={place} className="px-3 py-2 bg-green-600 text-white rounded">Place Order</button>
        </div>
      </div>
    </div>
  );
}

function MapView({ location }){
  const src = `https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`;
  return (
    <iframe title="truck-map" src={src} className="w-full h-64 border-0" />
  );
}

function AdminPanel({ orders, menu }){
  return (
    <div className="grid md:grid-cols-2 gap-4 mt-4">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-medium">Orders</h3>
        <ul className="mt-3 space-y-2">
          {orders.map(o=> (
            <li key={o.id} className="p-2 border rounded flex justify-between">
              <div>
                <div className="font-medium">#{o.id} • {o.customer_name}</div>
                <div className="text-sm text-gray-600">₹{((o.total||0)/100).toFixed(2)}</div>
              </div>
              <div className="text-sm">{o.status}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-medium">Menu management</h3>
        <div className="mt-3 space-y-2">
          {menu.map(m=> (
            <div key={m.id} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-gray-500">₹{(m.price_cents/100).toFixed(2)}</div>
              </div>
              <div className="text-sm text-gray-600">{m.available ? 'Available' : 'Hidden'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function sampleMenu(){
  return [
    { id:1, name:'Masala Dosa', description:'Crispy dosa with potato masala', price_cents:15000, available:true, image_url:'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=60' },
    { id:2, name:'Paneer Wrap', description:'Spicy paneer with fresh veggies', price_cents:12000, available:true, image_url:'https://images.unsplash.com/photo-1604908177522-4e0f4a6b7f5a?auto=format&fit=crop&w=800&q=60' },
    { id:3, name:'Chai', description:'Hot Indian tea', price_cents:3000, available:true, image_url:'https://images.unsplash.com/photo-1510696092049-6f2f6f7f3aaf?auto=format&fit=crop&w=800&q=60' },
    { id:4, name:'Samosa', description:'Crispy potato samosa', price_cents:4000, available:true, image_url:'https://images.unsplash.com/photo-1604908177522-4e0f4a6b7f5a?auto=format&fit=crop&w=800&q=60' },
    { id:5, name:'Cold Coffee', description:'Iced coffee delight', price_cents:10000, available:true, image_url:'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=60' },
  ];
}
