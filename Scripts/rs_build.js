const cfg = {
    "_id": "rs",
    "writeConcernMajorityJournalDefault" : true,
    "members" : [
        {
                "_id" : 0,
                "host" : "localhost:29001",
                "arbiterOnly" : false,
                "buildIndexes" : true,
                "hidden" : false,
                "priority" : 10,
                "tags" : {

                },
                "secondaryDelaySecs" : 0,
                "votes" : 1
        },
        {
                "_id" : 1,
                "host" : "localhost:29002",
                "arbiterOnly" : false,
                "buildIndexes" : true,
                "hidden" : false,
                "priority" : 5,
                "tags" : {

                },
                "secondaryDelaySecs" : 0,
                "votes" : 1
        },
        {
                "_id" : 2,
                "host" : "localhost:29003",
                "arbiterOnly" : false,
                "buildIndexes" : true,
                "hidden" : false,
                "priority" : 1,
                "tags" : {

                },
                "secondaryDelaySecs" : 0,
                "votes" : 1
        }
    ],
    "settings" : {
        "chainingAllowed" : true,
        "getLastErrorModes" : {

        },
        "getLastErrorDefaults" : {
                "w" : 1,
                "wtimeout" : 0
        }
    }
};

(function(){
	print("Start initiating replica set <"+cfg._id+"> with config:");
	printjson( cfg );

	try {
		rs.initiate( cfg );
	} catch (e) {
        print("ERROR in rs.initiate: " + e.message);
        return false;
    };
    print("Replica set <"+cfg._id+"> was initiated success.");
})();
