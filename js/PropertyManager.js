let PropertyManagerHandler = {
    set: function(obj, prop, value) {
	if(prop.includes('_PropMan_')){
	    obj[prop] = value;
	    return true;
	}   
	try{
	    if(!Object.getOwnPropertyDescriptor(obj, prop).writable){
		console.error("Can't set the value for " + prop + " in PropertyManager");
		return false;
	    }
	}
	catch(e){};

	if(prop in obj._PropMan_validations){
	    if(!(obj._PropMan_validations[prop].reduce(function(a,b) {return a&&b(value)}, true)))
		return false;
	}
	
	try{
	    if(value.hasOwnProperty('_PropMan'))
		value._PropMan_parent = {'prop': prop,
					     'obj':obj};
	}
	catch(err){}
	
	
	if(prop in obj){
	    if(obj[prop] != value){
		obj[prop] = value;
		obj._PropMan_propogate_event({'prop': prop, 'event': 'change',
					      'value': value, 'path': [],
					      'obj': obj})
	    }
	    else{
		return true;
	    }
	}
	else{ //add callback (not propogated to parents)
	    obj[prop] = value;
	    if('add' in obj._PropMan_callbacks)
		obj._PropMan_callbacks['add'].forEach(function(f){
		    f({'event': 'add', 'prop': prop, 'value': value})
		});
	}
	return true;
	   
    },

    deleteProperty: function(obj, prop){
	if('remove' in obj._PropMan_callbacks)
	    obj._PropMan_callbacks['remove'].forEach(function(f){
		f({'event': 'remove', 'prop': prop, 'value': obj[prop]})
	    });
	delete obj[prop];
	return true;
    },
    
    has: function(obj, prop){
	if (prop.includes('_PropMan_')) {
	    return false;
	}
	return prop in obj;
    },
};

function PropertyManager(map){
    if(map == undefined) map = {};
    Object.defineProperty(map, '_PropMan_callbacks', {value: {}, enumerable: false});
    Object.defineProperty(map, '_PropMan_parent', {value: undefined, enumerable: false, writable: true});
    Object.defineProperty(map, '_PropMan', {value: true, enumerable: false, writable: false, configurable: false});
    Object.defineProperty(map, '_PropMan_validations', {value: {}, enumerable: false});
    Object.defineProperty(map, 'on', {
	value: function(event, callback, prop){
	    if(['add', 'remove', 'change'].indexOf(event) < 0){
		console.error('Event type not understood');
		return false;
	    }
	    if(! (callback instanceof Function) ){
		console.error('CallBack should be a function');
		return false;
	    }
	    
	    if(prop == undefined){
		if(event == 'change'){
		    console.error('Change event can only have callbacks for specific properties');
		    return false;
		}
		if( !(event in this._PropMan_callbacks) )
		    this._PropMan_callbacks[event] = [];
		this._PropMan_callbacks[event].push(callback);
	    }
	    else{
		if ( !(prop instanceof Array) )
		    prop = Array(prop);
		prop.forEach(function(p) {
		    if( !(p in this._PropMan_callbacks) )
			this._PropMan_callbacks[p] = {'change': [],
						      'add': [],
						      'remove': [] };
		    this._PropMan_callbacks[p][event].push(callback);
		}.bind(this));
	    }
	},
	configurable: false,
	writable: false,
	enumerable: false});
    
    Object.defineProperty(map, 'add_validation', {
	value: function(prop, validator){
	    if(! (validator instanceof Function) ){
		console.error('Validator should be a function');
		return false;
	    }
	    if( !(prop in this._PropMan_validations) )
		this._PropMan_validations[prop] = []
	    this._PropMan_validations[prop].push(validator);
	    return true;
	},
	enumerable: false,
	writable: false,
	configurable: false});
    
    Object.defineProperty(map, '_PropMan_propogate_event', {
	value: function(e){
	    if(e['prop'] in this._PropMan_callbacks){
		this._PropMan_callbacks[e['prop']]['change'].forEach(function(f){
		    f(e)
		});
	    }
	    if(this._PropMan_parent !== undefined){
		e.path.push(this._PropMan_parent['prop']);
		this._PropMan_parent['obj']._PropMan_propogate_event(e);
	    }
	},
	enumerable: false,
	writable: false,
	configurable: false});

    return new Proxy(map, PropertyManagerHandler)    
}