Swap Flow using 9X Aggregator (https://api.9mm.pro)
1. 📝 User Input Parsing
 // User: "swap 10 PLS for PLSX" const parsed = parseCommand("swap 10 PLS for PLSX"); /* Returns: {   intent: 'swap',   fromToken: 'PLS',   toToken: 'PLSX',   amount: '10' } */ 
2. 🔎 Token & Amount Conversion
 // Token Address Mapping const POPULAR_TOKENS = {   PLS: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native PLS   PLSX: "0x95b303987a60c71504d99aa1b13b4da07b0790ab" };  const sellToken = POPULAR_TOKENS[parsed.fromToken]; const buyToken = POPULAR_TOKENS[parsed.toToken]; const amountInWei = ethers.utils.parseUnits(parsed.amount, 18).toString(); 
3. 🌐 Quote API Call (9X)
 const QUOTE_API = `https://api.9mm.pro/swap/v1/quote`;  const params = new URLSearchParams({   sellToken,   buyToken,   sellAmount: amountInWei,   takerAddress: "0xYourUserWalletAddress",   slippagePercentage: "0.005" // 0.5% });  const res = await fetch(`${QUOTE_API}?${params}`); const quote = await res.json();  /**  * quote = {  *   to: '0x4491dbefc128e2de184baba03e7c991356f733ce',  *   data: '0x1234abcd...',  *   value: '10000000000000000000',  *   gas: '210000',  *   buyAmount: '...'  * }  */ 
4. 🧱 Transaction Preparation
 await sessionService.createPendingTransaction({   id: 'tx_abc123',   quote,   type: 'swap',   user, }); sendMessageToUser("Confirm swap of 10 PLS → PLSX?"); 
5. ✅ User Confirmation & Execution
 // On "yes" confirmation const tx = await sessionService.getPendingTransaction('tx_abc123'); const wallet = new ethers.Wallet(user.privateKey, provider);  const txData = {   to: tx.quote.to,   data: tx.quote.data,   value: tx.quote.value,   gasLimit: tx.quote.gas };  const result = await wallet.sendTransaction(txData); await result.wait(); 
6. ⛓️ Blockchain Execution
 - The `to` address is the 9X Router. - `data` contains all swap logic (sell token, buy token, path). - `value` is used for native token swaps (PLS → token). - 9X handles DEX routing behind the scenes. 
7. 🧠 Notes & Error Handling
 - If the transaction fails (status: 0):   - Retry with fresh quote (quotes expire fast).   - Ensure enough gas and value.   - Validate token approvals if using ERC20 sellToken. - 9X API chooses the router and builds calldata. - Your system only signs and submits the raw data from quote. 