package org.gaea.framework.web.schema.view.jo;

import org.gaea.framework.web.schema.domain.SchemaImport;
import org.gaea.framework.web.schema.domain.view.SchemaActions;
import org.gaea.framework.web.schema.domain.view.SchemaDialog;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * 这个是JO对象，负责把Schema View的相关内容暴露给外部的。
 * <p/>
 * Created by Iverson on 2017年6月20日16:17:30
 */
public class SchemaViewJO implements Serializable {
    //    private SchemaGrid grid;
    private SchemaGridJO grid;
    private List<SchemaDialogJO> dialogs;
    private SchemaActionsJO actions;
    //    private SchemaImport imports;
    private String title;

    public List<SchemaDialogJO> getDialogs() {
        if (dialogs == null) {
            dialogs = new ArrayList<SchemaDialogJO>();
        }
        return dialogs;
    }

    public void setDialogs(List<SchemaDialogJO> dialogs) {
        this.dialogs = dialogs;
    }

    public SchemaGridJO getGrid() {
        return grid;
    }

    public void setGrid(SchemaGridJO grid) {
        this.grid = grid;
    }

    public SchemaActionsJO getActions() {
        return actions;
    }

    public void setActions(SchemaActionsJO actions) {
        this.actions = actions;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
