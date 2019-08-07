import * as request from "request-promise";
import { FilesInfo } from "./FilesInfo";
import { SearchScicat } from "./SearchScicat";
import * as fs from "fs";

class ReplaceOrig {
  base_url = "https://scicatapi.esss.dk/api/v3";
  token = "";

  async login() {
    const config = fs.readFileSync("config.json");
    const uri = this.base_url + "/Users/login";
    const loginOptions = {
      uri: uri,
      method: "PUT",
      body: config,
      json: true,
      rejectUnauthorized: false,
      requestCert: true
    };
    const response = await request.post(loginOptions);
    console.log(response)
    this.token = response.id;
    
  }

  async postToScicat() {
    await this.login()
    const search = new SearchScicat();
    const tag = "nicos_00000490";
    const results = await search.search(tag);
    const result = results[0];
    const uri = this.base_url;
    const pid = result["pid"];
    console.log("pid: ", pid);
    // delete old orig for pid
    this.delete_old_orig(pid);
    // fetch file info
    const fileInfo = new FilesInfo("demo/nicos_00000490.hdf");
    const info = fileInfo.files;
    console.log(info);
    // add new orig
    this.add_new_orig(pid, info);
  }

  delete_old_orig(pid: string) {
    const delete_uri =
      this.base_url +
      "/Datasets/" +
      encodeURIComponent(pid) +
      "/origdatablocks";
    // const response = request.delete(delete_uri);
    console.log("deleting", delete_uri);
  }

  add_new_orig(pid: string, fileinfo: Object) {
    const orig = {
      size: 0,
      dataFileList: fileinfo,
      ownerGroup: "ess",
      accessGroups: ["loki"],
      datasetId: pid
    };

    const uri =
      this.base_url +
      "/Datasets/" +
      encodeURIComponent(pid) +
      "/origdatablocks" +
      this.token;
    console.log("adding new orig", pid);
    console.log("adding new orig", uri);

    let options3 = {
      url: uri,
      method: "PUT",
      body: orig,
      json: true,
      rejectUnauthorized: false,
      requestCert: true
    };
    request.post(options3);
  }
}

if (require.main === module) {
  const fix = new ReplaceOrig();
  fix.postToScicat();
}
