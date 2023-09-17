
async function getUsers(offset = 0) {
    const res = await fetch("https://misskey.neos.love/api/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "i": process.env.MISSKEY_API_KEY,
            limit: 100,
            offset: offset,
        })
    })
    const json = await res.json()
    if (json.length > 1) {
        return json.concat(await getUsers(offset + 100))
    } else {
        return json
    }
}

const getUser = async (userId) => {
    const res = await fetch("https://misskey.neos.love/api/charts/user/notes?limit=6000&span=hour&userId="+userId);
    const json = await res.json();
    return json.total
}

const insertData = async (userId, username, data, date) => {
    console.log(userId, username, data, date)
    const res = await fetch("http://192.168.10.238:8428/api/v1/import/prometheus/metrics/job/misskey/instance/192.168.10.106:80?timestamp=" + date.getTime(), {
        method: "POST",
        body: `user_notes{instance="192.168.10.106:80",job="misskey",user_id="${userId}",username="${username}"} ${data}`,
        headers: {
            "Content-Type": "text/plain"
        }
    })
    if(!res.ok) {
        console.log("error")
    }
}

const sleep = (msec) => new Promise(resolve => setTimeout(resolve, msec));

const users = await getUsers()
for(const user of users){
    const username = user.username
    const userId = user.id
    const data = (await getUser(userId)).filter(d => d > 0)
    const date = new Date(1694873486643)
    for(const d of data) {
        // １時間づつdateを減らしていく
        date.setHours(date.getHours() - 1)
        await insertData(userId, username, d, date)
        await sleep(1)
    }
}