const Twit = require('twit')
const bunyan = require('bunyan');
const _ = require('lodash')
const twitterKeys = require('./twitterKeys.json')

const lang =  {fr : 'concours, RT', en: 'Contest, RT'}
const botScreenName = 'robot__san'
const dayBeforeUnfollow = 14;
const log = bunyan.createLogger({name: 'TwitterBotContest', streams: [{
        path: 'bot.log',
        // `type: 'file'` is implied
    }]});

const T = new Twit(twitterKeys);

/**
 * Send a post request to retweet
 * @param tweetID unique id of the tweet
 */
function retweet(tweetID) {

    T.post('statuses/retweet/:id', {
        id: tweetID
    }, function(err, response) {
        log.info('statuses/retweet/:id' , {tweetID : tweetID});
        if (response) {
            log.info('success')
        }
        if (err) {
            log.error(err.code, err.message);
        }
    });
}

/**
 * Send a post request to unfollow an user
 * @param {object} user 
 */
function unfollow(userID) {
    T.post('friendships/destroy', {user_id: userID}, function (err, data, response) {
        log.info('friendships/destroy', user)
        if (response) {
            log.info('success')
        }
        if (err) {
            log.error(err.code, err.message);
        }
    })
}

/**
 * send a batch of request to unfollow all bot user
 */
function unfollowAll() {
    T.post('friends/ids', {screen_name: botScreenName}, function(err, data, response) {   
        log.info('friendships/ids', user)
        if (response) {
            _.forEach(data.ids, function (userId) {
                unfollow(userId)
            })
        }
        if (err) {
            log.error(err.code, err.message);
        }
    })
}

/**
 * send a post request to create a friendship with an user
 * @param user object
 */
function follow(user) {

        T.post('friendships/create', {user_id: user.id_str, follow: true}, function (err, data, response) {
            log.info('friendships/create', user)
            if (response) {
                log.info('success')
            }
            if (err) {
                log.error(err.code, err.message);
            }
        })

}

/**
 * Search the 100 latest  tweet containing q then follow the tweet owner, RT the tweet then follow the mentions
 * @param q the rlrmrnt to look for in each tweet
 */
function participateContest(q) {
    var params = {
        q: q,
        result_type: 'recent',
        count : 100,
        include_entities: true
    }

    T.get('search/tweets',params, function(err, data, response) {
        log.info('search/tweets', params)
        if (!err) {
            _.forEach(data.statuses, function (tweet) {
                if (!tweet.retweeted) {
                retweet(tweet.id_str)
                follow(tweet.user)
                _.forEach(tweet.entities.user_mentions, function (userToFollow) {
                    follow(userToFollow)
                })
                }
            })
        }
    })
}
participateContest(lang.fr)
participateContest(lang.en)
setInterval(function(){ participateContest(lang.fr);participateContest(lang.en)}, 2*60*60*1000);
setInterval(function(){ unfollowAll()}, dayBeforeUnfollow*24*60*60*1000);
