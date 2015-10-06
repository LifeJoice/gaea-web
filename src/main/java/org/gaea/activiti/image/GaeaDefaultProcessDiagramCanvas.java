package org.gaea.activiti.image;

import org.activiti.engine.impl.context.Context;
import org.activiti.image.impl.DefaultProcessDiagramCanvas;

/**
 * Created by Iverson on 2015/6/1.
 */
public class GaeaDefaultProcessDiagramCanvas extends DefaultProcessDiagramCanvas {
    protected static String DEFAULT_IMAGE_TYPE = "png";
    protected static String DEFAULT_FONT_NAME = "宋体";

    public GaeaDefaultProcessDiagramCanvas(int width, int height, int minX, int minY, ClassLoader customClassLoader) {
        this(width, height, minX, minY, DEFAULT_IMAGE_TYPE, DEFAULT_FONT_NAME, DEFAULT_FONT_NAME, customClassLoader);
    }

    private void initFontName() {
        if (Context.getProcessEngineConfiguration() != null) {
            this.activityFontName = Context.getProcessEngineConfiguration().getActivityFontName();
        }

        if (Context.getProcessEngineConfiguration() != null) {
            this.labelFontName = Context.getProcessEngineConfiguration().getLabelFontName();
        }
    }

    public GaeaDefaultProcessDiagramCanvas(int width, int height, int minX, int minY, String imageType) {
        super(width, height, minX, minY, imageType);
        initFontName();
    }

    public GaeaDefaultProcessDiagramCanvas(int width, int height, int minX, int minY, String imageType, String activityFontName, String labelFontName, ClassLoader customClassLoader) {
        super(width, height, minX, minY, imageType, activityFontName, labelFontName, customClassLoader);
    }
}
