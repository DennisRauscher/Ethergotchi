pragma experimental ABIEncoderV2;
pragma solidity >=0.4.22 <0.9.0;

contract EthergotchiGlobal {
    struct Ethergotchi {
        uint256 id;
        address ownerAdress;
        string name;
        uint256 birthTimestamp;
        uint256 level;
        uint256 lastFeedTimestamp;
        uint256 lastPetTimestamp;
        uint256 seed;
        bool isDead;
    }

    struct Owner {
        address ownerAddress;
        string name;
    }

    address payable public owner;
    Ethergotchi[] gotchis;
    mapping(address => uint256) ownerGotchiCount;
    mapping(address => Owner) owners;

    constructor() public {
        owner = msg.sender;
    }

    function getEthergotchis() public view returns (Ethergotchi[] memory) {
        Ethergotchi[] memory returnedGotchis = new Ethergotchi[](
            ownerGotchiCount[msg.sender]
        );
        uint256 returnIndex = 0;

        for (uint256 index = 0; index < gotchis.length; index++) {
            if (gotchis[index].ownerAdress == msg.sender) {
                returnedGotchis[returnIndex] = gotchis[index];
                returnIndex++;
            }
        }

        return returnedGotchis;
    }

    function generateEthergotchi(string memory _name) public payable {
        require(address(this).balance > 1 wei);
        owner.transfer(1 wei);
        gotchis.push(
            Ethergotchi(
                gotchis.length,
                msg.sender,
                _name,
                block.timestamp,
                1,
                block.timestamp,
                block.timestamp,
                rand(),
                false
            )
        );
        ownerGotchiCount[msg.sender]++;
    }

    function setCurrentName(string memory _name) public {
        owners[msg.sender] = Owner(msg.sender, _name);
    }

    function getCurrentName() public view returns (string memory) {
        if (owners[msg.sender].ownerAddress != address(0)) {
            return owners[msg.sender].name;
        } else {
            return addressToString(msg.sender);
        }
    }

    function remove(uint256 id) public {
        for (uint256 index = 0; index < gotchis.length; index++) {
            if (
                gotchis[index].ownerAdress == msg.sender &&
                gotchis[index].id == id
            ) {
                delete gotchis[index];
                ownerGotchiCount[msg.sender]--;
            }
        }
    }

    function feed(uint256 id) public {
        for (uint256 index = 0; index < gotchis.length; index++) {
            if (
                gotchis[index].ownerAdress == msg.sender &&
                gotchis[index].id == id
            ) {
                if (
                    block.timestamp - gotchis[index].lastFeedTimestamp > 86400
                ) {
                    // 24h
                    gotchis[index].isDead = true;
                    return;
                }
                gotchis[index].lastFeedTimestamp = block.timestamp;
            }
        }
    }

    function addressToString(address _addr)
        public
        pure
        returns (string memory)
    {
        bytes32 value = bytes32(uint256(_addr));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(51);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    function stringToBytes32(string memory source)
        public
        pure
        returns (bytes32 result)
    {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }

    function rand() public view returns (uint256) {
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp +
                        block.difficulty +
                        ((
                            uint256(keccak256(abi.encodePacked(block.coinbase)))
                        ) / (now)) +
                        block.gaslimit +
                        ((uint256(keccak256(abi.encodePacked(msg.sender)))) /
                            (now)) +
                        block.number
                )
            )
        );

        return (seed - ((seed / 100000) * 100000));
    }
}
