/**
 * Created by user on 2016-07-03.
 */
import findOrCreatePlugin from 'mongoose-findorcreate';
import Promise from 'promise';

function findOrCreate(schema, options) {
  const s = schema;
  findOrCreatePlugin(schema, options);
  s.statics.findOrCreate = Promise.denodeify(s.statics.findOrCreate);
}

export default findOrCreate;
