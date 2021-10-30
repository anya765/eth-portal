import { ethers } from "ethers";
import { useEffect, useState } from "react";
import "./App.css";
import WavePortalContract from "./utils/WavePortal.json";

function App() {
	const [currentAccount, setCurrentAccount] = useState("");
	const [allWaves, setAllWaves] = useState([]);
	const [waveText, setWaveText] = useState("");
	const [mining, setMining] = useState(false);
	const contractAddress = "0xd63aBff74143f24f5a7A2156c205c36D94dCc7c5";
	const contractABI = WavePortalContract.abi;
	const { ethereum } = window;
	const provider = ethereum && new ethers.providers.Web3Provider(ethereum);
	const signer = ethereum && provider.getSigner();
	const wavePortalContract =
		ethereum && new ethers.Contract(contractAddress, contractABI, signer);

	useEffect(() => {
		const initialCheck = async () => {
			await checkIfWalletIsConnected();
			await getAllWaves();
		};

		initialCheck();
	}, []);

	useEffect(() => {
		let wavePortalContract;

		const onNewWave = (from, timestamp, message) => {
			console.warn("NewWave", from, timestamp, message);
			setAllWaves((prevState) => [
				...prevState,
				{
					address: from,
					timestamp: new Date(timestamp * 1000),
					message: message,
				},
			]);
		};

		if (window.ethereum) {
			wavePortalContract = new ethers.Contract(
				contractAddress,
				contractABI,
				signer
			);
			wavePortalContract.on("NewWave", onNewWave);
		}

		return () => {
			if (wavePortalContract) {
				wavePortalContract.off("NewWave", onNewWave);
			}
		};
	}, []);

	const checkIfWalletIsConnected = async () => {
		try {
			if (!ethereum) {
				console.log("Make sure you have metamask!");
				return;
			} else {
				console.log("We have the ethereum object", ethereum);
			}

			const accounts = await ethereum.request({ method: "eth_accounts" });

			if (accounts.length !== 0) {
				const account = accounts[0];
				console.log("Found an authorized account:", account);
				setCurrentAccount(account);
			} else {
				console.log("No authorized account found");
			}
		} catch (error) {
			console.log(error);
		}
	};

	const connectWallet = async () => {
		try {
			if (!ethereum) {
				alert("Get MetaMask!");
				return;
			}

			const accounts = await ethereum.request({
				method: "eth_requestAccounts",
			});

			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};

	const getAllWaves = async () => {
		try {
			if (ethereum) {
				const waves = await wavePortalContract.getAllWaves();

				/*
				 * We only need address, timestamp, and message in our UI so let's
				 * pick those out
				 */
				let wavesCleaned = [];
				waves.forEach((wave) => {
					wavesCleaned.push({
						address: wave.waver,
						timestamp: new Date(wave.timestamp * 1000),
						message: wave.message,
					});
				});

				/*
				 * Store our data in React State
				 */
				setAllWaves(wavesCleaned);
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}
	};

	const wave = async () => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				setMining(true);
				const waveTxn = await wavePortalContract.wave(waveText, {
					gasLimit: 300000,
				});
				console.log("Mining...", waveTxn.hash);
				setWaveText("");

				await waveTxn.wait();
				console.log("Mined -- ", waveTxn.hash);
				setMining(false);
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			setMining(false);
			setWaveText("");
			console.log(error);
		}
	};

	const handleTextChange = (event) => setWaveText(event.target.value);

	return (
		<div className="mainContainer">
			<div className="dataContainer">
				<div className="header">👋 Hey there, here is a joke portal!</div>

				<div className="bio">
					Hello I am Anya. Connect your Ethereum wallet and wave at me!
				</div>

				<label>
					Type your name:
					<input
						type="text"
						value={waveText}
						onChange={handleTextChange}
						style={{
							width: "50%",
							marginLeft: "8px",
							marginTop: "24px",
							marginBottom: "12px",
							borderLeft: "0px",
							borderTop: "0px",
							borderRight: "0px",
						}}
					/>
				</label>

				<button
					className="waveButton"
					disabled={waveText.length < 2}
					onClick={wave}
				>
					{ethereum ? "Tell me a joke" : "Please install metamask in browser"}
				</button>

				{!currentAccount && (
					<button className="waveButton" onClick={connectWallet}>
						Connect Wallet
					</button>
				)}

				{mining ? (
					<p>Total waves: Mining... Please wait</p>
				) : (
					<p>Total waves count: {allWaves.length}</p>
				)}

				<p>All waves:</p>
				{!currentAccount && <p>Connect Your wallet to see who else waved!</p>}
				<div style={{ marginBottom: "32px" }}>
					{allWaves.map((wave, index) => {
						return (
							<div
								key={index}
								style={{
									backgroundColor: "OldLace",
									marginTop: "16px",
									padding: "8px",
								}}
							>
								<div>Address: {wave.address}</div>
								<div>Time: {wave.timestamp.toString()}</div>
								<div>Message: {wave.message}</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default App;
