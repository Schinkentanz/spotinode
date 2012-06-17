exports.settings = {
	cache: {
		TTL: 3600 //seconds
	},
	server: {
		PORT: process.env.PORT || 3000,
		VIEW_PATH: '/../views',
		VIEW_ENGINE: 'jade',
		PUBLIC_PATH: '/../public'
	},
	logger: {
		ACTIVE: true
	},
	dao: {
		file: {
			valid: {
				MP3: true
			},
			types: {
				FILE: 1,
				FOLDER: 2
			}
		}
	},
	manager: {
		file: {
			CACHE_KEY: 'files',
			ROOT_PATH: '/tf/music'
		}
	},
	controller: {
		
	},
	mongo: {
		USERNAME: '',
		PASSWORD: '',
		HOST: '127.0.0.1',
		PORT: 27017,
		DATABASE: 'local',
		COLLECTIONS: ['files']
	}
}
