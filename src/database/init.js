/**
 * Created by comet on 16/10/15.
 */
import GlobalModel from './models/global';

function initDatabase() {
  return GlobalModel.findOrCreate({ _id: 'global' });
}

export default initDatabase;
