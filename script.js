// Initialize Firebase (global scope)
try {
  const firebaseConfig = {
    apiKey:"YOUR_API_KEY",
    authDomain:"YOUR_PROJECT.firebaseapp.com",
    databaseURL:"https://YOUR_PROJECT.firebaseio.com",
    projectId:"YOUR_PROJECT",
  };
  firebase.initializeApp(firebaseConfig);
  var db = firebase.database();
  console.log('✅ Firebase initialized');
} catch (e) {
  console.log('⚠️ Firebase not available, using localStorage only');
}

// Storage Interface - Define FIRST before any functions
window.dataStore = {
  save: function(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log('✅ Saved:', key);
      return true;
    } catch (e) {
      console.error('❌ Save failed:', key, e);
      return false;
    }
  },
  
  load: function(key) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        console.log('✅ Loaded:', key);
        return JSON.parse(item);
      }
      console.log('⚠️ Not found:', key);
      return null;
    } catch (e) {
      console.error('❌ Load failed:', key, e);
      return null;
    }
  },
  
  delete: function(key) {
    try {
      localStorage.removeItem(key);
      console.log('✅ Deleted:', key);
      return true;
    } catch (e) {
      console.error('❌ Delete failed:', key, e);
      return false;
    }
  }
};

console.log('✅ dataStore initialized');

function accessAdmin() {
  const password = prompt("Enter admin password:");
  if (password === "admin123") {
    document.getElementById("adminSection").style.display = "block";
    alert("Admin access granted");
  } else {
    alert("Incorrect password");
  }
}

function generateId(){
  return 'SK' + Math.floor(Math.random()*100000);
}

function bookOrder(){
  // Get form elements
  const senderInput = document.getElementById('sender');
  const pickupInput = document.getElementById('pickup');
  const receiverInput = document.getElementById('receiver');
  const deliveryInput = document.getElementById('delivery');
  const msgDisplay = document.getElementById('msg');

  if (!senderInput || !pickupInput || !receiverInput || !deliveryInput || !msgDisplay) {
    console.error('❌ Form elements missing');
    return;
  }

  const sender = senderInput.value.trim();
  const pickup = pickupInput.value.trim();
  const receiver = receiverInput.value.trim();
  const delivery = deliveryInput.value.trim();

  // Validation: All fields required
  if (!sender || !pickup || !receiver || !delivery) {
    msgDisplay.innerHTML = "❌ All fields are required";
    return;
  }

  let id = generateId();

  const orderData = {
    sender: sender,
    pickup: pickup,
    receiver: receiver,
    delivery: delivery,
    status:'Picked Up'
  };

  localStorage.setItem('orders/'+id, JSON.stringify(orderData));
  msgDisplay.innerHTML = "Booking ID: " + id;
}

async function trackOrder(){
  const trackingIdInput = document.getElementById('trackId');
  
  if (!trackingIdInput) {
    console.error('❌ trackId element not found');
    return;
  }

  const trackingNumber = trackingIdInput.value.trim();

  if(!trackingNumber){
    showTrackingResult("❌ Please enter a tracking number");
    return;
  }

  console.log("🔍 Tracking:", trackingNumber);

  try {
    // Check if we have saved data
    const result = checkFirebaseTracking(trackingNumber);
    
    if(result.found){
      console.log("✅ Found in storage:", result);
      displayTrackingResult(result);
      return;
    }

    // If not found, show simulated result
    console.log("⚠️ Not in storage, showing simulated result");
    const courierResult = simulateCourierTracking(trackingNumber);
    displayTrackingResult(courierResult);

  } catch (error) {
    console.error("❌ Tracking error:", error);
    showTrackingResult("❌ Error: " + error.message);
  }
}

function checkFirebaseTracking(trackingNumber){
  console.log("🔍 Checking for:", trackingNumber);

  // Verify dataStore is available
  if (!window.dataStore) {
    console.error('❌ dataStore not available');
    return {found: false};
  }

  // Check internal orders first
  const orderData = window.dataStore.load('orders/' + trackingNumber);
  if(orderData){
    console.log('✅ Found order data');
    return {
      found: true,
      type: 'internal',
      status: orderData.status,
      details: orderData
    };
  }

  // Check courier tracking
  const courierData = window.dataStore.load('courier_tracking/' + trackingNumber);
  if(courierData){
    console.log('✅ Found courier data');
    return {
      found: true,
      type: 'courier',
      status: courierData.status,
      progress: courierData.progress,
      carrier: courierData.carrier,
      details: courierData
    };
  }

  console.log('❌ Not found in storage');
  return {found: false};
}

function simulateCourierTracking(trackingNumber){
  // Create deterministic "random" status based on tracking number
  const hash = trackingNumber.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
  const statusIndex = hash % 5;
  
  const statuses = [
    {text: 'Package Received', progress: 20, color: '#ff9800'},
    {text: 'In Transit', progress: 50, color: '#2196f3'},
    {text: 'Out for Delivery', progress: 80, color: '#ff5722'},
    {text: 'Delivered', progress: 100, color: '#4caf50'},
    {text: 'Exception', progress: 0, color: '#f44336'}
  ];
  
  const status = statuses[statusIndex];
  
  // Simulate some additional details
  const carriers = ['DHL', 'FedEx', 'UPS', 'USPS', 'BlueDart'];
  const carrier = carriers[hash % carriers.length];
  
  return {
    type: 'courier',
    status: status.text,
    progress: status.progress,
    carrier: carrier,
    estimatedDelivery: status.text === 'Delivered' ? 'Delivered' : 'Expected in 2-3 days',
    trackingNumber: trackingNumber
  };
}

function displayTrackingResult(result){
  try {
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    const trackingUI = document.getElementById('trackingUI');
    
    if (!statusText || !progressBar || !trackingUI) {
      console.error('❌ Elements missing - statusText:', !!statusText, 'progressBar:', !!progressBar, 'trackingUI:', !!trackingUI);
      showTrackingResult('❌ Missing tracking display elements');
      return;
    }
    
    if(result.type === 'internal'){
      statusText.innerHTML = `
        <strong>Your Order Status:</strong> ${result.status}<br>
        <small>${result.details.sender} → ${result.details.receiver}</small>
      `;
      progressBar.style.width = '100%';
      progressBar.style.background = '#4caf50';
    } else if(result.type === 'courier' && result.details){
      // Real courier data from storage
      statusText.innerHTML = `
        <strong>Carrier: ${result.carrier}</strong><br>
        <strong>Status:</strong> ${result.status}<br>
        <strong>Last Updated:</strong> ${new Date(result.details.lastUpdated).toLocaleString()}<br>
        <small>From: ${result.details.sender} To: ${result.details.receiver}</small>
      `;
      progressBar.style.width = result.progress + '%';
      progressBar.style.background = getProgressColor(result.progress);
    } else {
      // Simulated data
      statusText.innerHTML = `
        <strong>Carrier: ${result.carrier}</strong><br>
        <strong>Status:</strong> ${result.status}<br>
        <strong>Tracking ID:</strong> ${result.trackingNumber}<br>
        <small>${result.estimatedDelivery}</small>
      `;
      progressBar.style.width = result.progress + '%';
      progressBar.style.background = getProgressColor(result.progress);
    }
    
    trackingUI.style.display = 'block';
  } catch (error) {
    console.error('❌ displayTrackingResult error:', error);
    showTrackingResult('❌ Error displaying results: ' + error.message);
  }
}

function showTrackingResult(message){
  const statusText = document.getElementById('statusText');
  const trackingUI = document.getElementById('trackingUI');
  
  statusText.innerHTML = message;
  trackingUI.style.display = message.includes('Searching') ? 'none' : 'block';
}

function getProgressColor(progress){
  if(progress >= 80) return '#4caf50'; // Green
  if(progress >= 50) return '#ff9800'; // Orange
  if(progress >= 20) return '#2196f3'; // Blue
  return '#f44336'; // Red
}

function calcPrice(){
  const kmInput = document.getElementById('km');
  const wtInput = document.getElementById('wt');
  const priceDisplay = document.getElementById('price');

  if (!kmInput || !wtInput || !priceDisplay) {
    console.error('❌ Price form elements missing');
    return;
  }

  const km = parseFloat(kmInput.value.trim()) || 0;
  const wt = parseFloat(wtInput.value.trim()) || 0;

  // Validation: Both fields required and positive
  if (km <= 0 || wt <= 0) {
    priceDisplay.innerHTML = "❌ Please enter valid distance and weight";
    return;
  }

  let price = 30 + (km * 5) + (wt * 10);
  priceDisplay.innerHTML = "₹ " + price;
}

function loadOrders(){
  let html = '';

  // Load from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('orders/')) {
      const id = key.replace('orders/', '');
      const data = JSON.parse(localStorage.getItem(key));
      html += createOrderHTML(id, data);
    }
  }
  orders.innerHTML = html;
}

function createOrderHTML(id, data) {
  return `<div>
    <b>${id}</b><br>
    ${data.sender} → ${data.receiver}<br>
    <select onchange="updateStatus('${id}',this.value)">
      <option ${data.status === 'Picked Up' ? 'selected' : ''}>Picked Up</option>
      <option ${data.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
      <option ${data.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
    </select>
  </div><hr>`;
}

function updateStatus(id,status){
  const existingDataStr = localStorage.getItem('orders/'+id);
  if (existingDataStr) {
    const existingData = JSON.parse(existingDataStr);
    existingData.status = status;
    localStorage.setItem('orders/'+id, JSON.stringify(existingData));
  }
}

// Function to add real courier tracking data
function addCourierTracking(trackingNumber, carrier, status, sender, receiver) {
  if (!window.dataStore) {
    console.error('❌ dataStore not available');
    return false;
  }

  const trackingData = {
    carrier: carrier,
    status: status,
    sender: sender || 'Unknown',
    receiver: receiver || 'Unknown',
    lastUpdated: new Date().toISOString(),
    progress: getProgressFromStatus(status)
  };

  return window.dataStore.save('courier_tracking/' + trackingNumber, trackingData);
}

// Function to handle adding tracking data from admin panel
function addTrackingData() {
  try {
    // Verify dataStore is available
    if (!window.dataStore) {
      console.error('❌ dataStore not initialized');
      alert('Storage system not ready');
      return;
    }

    // Get form elements
    const trackingIdInput = document.getElementById('courierTrackingId');
    const carrierInput = document.getElementById('courierCarrier');
    const statusInput = document.getElementById('courierStatus');
    const senderInput = document.getElementById('courierSender');
    const receiverInput = document.getElementById('courierReceiver');
    const msgDisplay = document.getElementById('trackingMsg');

    if (!trackingIdInput || !carrierInput || !statusInput || !msgDisplay) {
      console.error('❌ Form elements missing');
      alert('Form elements not found');
      return;
    }

    const trackingId = trackingIdInput.value.trim();
    const carrier = carrierInput.value;
    const status = statusInput.value;
    const sender = senderInput ? senderInput.value.trim() : '';
    const receiver = receiverInput ? receiverInput.value.trim() : '';

    console.log("📝 Adding: ID=" + trackingId + " Carrier=" + carrier + " Status=" + status);

    // Validation: Required fields
    if (!trackingId || !carrier || !status) {
      msgDisplay.innerHTML = '❌ Tracking ID, Carrier, and Status are required';
      return;
    }

    // Save data
    const trackingData = {
      carrier: carrier,
      status: status,
      sender: sender || 'Unknown',
      receiver: receiver || 'Unknown',
      lastUpdated: new Date().toISOString(),
      progress: getProgressFromStatus(status)
    };

    console.log("💾 Saving:", trackingData);
    const key = 'courier_tracking/' + trackingId;
    const saved = window.dataStore.save(key, trackingData);

    if (saved) {
      msgDisplay.innerHTML = '✅ Saved!';
      
      // Clear form
      trackingIdInput.value = '';
      if (senderInput) senderInput.value = '';
      if (receiverInput) receiverInput.value = '';

      setTimeout(() => {
        msgDisplay.innerHTML = '';
      }, 3000);
    } else {
      msgDisplay.innerHTML = '❌ Save failed';
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    const msgDisplay = document.getElementById('trackingMsg');
    if (msgDisplay) {
      msgDisplay.innerHTML = '❌ Error: ' + error.message;
    }
  }
}

// Helper function to convert status to progress percentage
function getProgressFromStatus(status) {
  const statusMap = {
    'Package Received': 20,
    'In Transit': 50,
    'Out for Delivery': 80,
    'Delivered': 100,
    'Exception': 0
  };
  return statusMap[status] || 50;
}

// Initialize on page load
window.addEventListener('load', function() {
  console.log('=== 🚀 SKTraderz App Loaded ===');
  console.log('✅ localStorage available');
  console.log('✅ Ready to save and track packages');
});
