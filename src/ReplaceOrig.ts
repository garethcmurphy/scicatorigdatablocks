import * as request from "request-promise";
import { FilesInfo } from "./FileInfo";
import { SearchScicat } from "./SearchScicat";
import * as fs from "fs";
import { GetApi } from "./GetAPI";

class ReplaceOrig {
  base_url: string;
  token = "";

  constructor() {
    const api = new GetApi();

    this.base_url = api.get();
  }

  async login() {
    const rawdata = fs.readFileSync("config.json", "utf-8");
    const config = JSON.parse(rawdata);
    const uri = this.base_url + "/Users/login";
    const loginOptions = {
      uri: uri,
      method: "PUT",
      body: config,
      json: true,
      rejectUnauthorized: false
    };
    const response = await request.post(loginOptions);
    console.log(response);
    this.token = response.id;
  }

  async postToScicat(tag: string) {
    const search = new SearchScicat();
    const results = await search.search(tag);
    const result = results[0];
    const uri = this.base_url;
    const pid = result["pid"];
    console.log("pid: ", pid);
    // delete old orig for pid
    this.deleteOldOrig(pid);
    // fetch file info
    const path = result["sourceFolder"];
    const fileInfo = new FilesInfo(path + "/" + tag + ".hdf");
    const info = fileInfo.files;
    console.log(info);
    // add new orig
    this.add_new_orig(pid, info);
  }

  deleteOldOrig(pid: string) {
    const delete_uri =
      this.base_url +
      "/Datasets/" +
      encodeURIComponent(pid) +
      "/origdatablocks?access_token=" +
      this.token;
    const deleteOptions = {
      uri: delete_uri,
      rejectUnauthorized: false
    };
    const response = request.delete(deleteOptions);
    console.log("deleting", response);
  }

  add_new_orig(pid: string, fileinfo: Object) {
    const orig = {
      size: fileinfo[0]["size"],
      dataFileList: fileinfo,
      ownerGroup: "ess",
      accessGroups: ["loki"],
      datasetId: pid
    };

    const uri =
      this.base_url +
      "/Datasets/" +
      encodeURIComponent(pid) +
      "/origdatablocks?access_token=" +
      this.token;
    console.log("adding new orig", pid);
    console.log("adding new orig", uri);

    let options3 = {
      url: uri,
      method: "PUT",
      body: orig,
      json: true,
      rejectUnauthorized: false
    };
    const response = request.post(options3);
    console.log(response);
  }

  async loop() {
    await this.login();
    let tag = "nicos_00000489";
    for (let step = 488; step < 490; step++) {
      tag = "nicos_00000" + step.toString();
      this.postToScicat(tag);
    }
  }
}

if (require.main === module) {
  const fix = new ReplaceOrig();
  fix.loop();
}
